import * as Tone from 'tone';
import type { GeneratedChart, Params } from './types';
import { flattenVoicedBars } from './voicings';
import { beatToTransportPosition, compingHits } from './rhythm';

export type PlaybackHandle = { stop: () => void };
type OnBar = (index: number) => void;

type InstrumentRack = {
  trigger: (note:string,duration:number,time:number,velocity:number)=>void;
  dispose: ()=>void;
};

type MetronomeRack = {
  trigger: (time:number,downbeat:boolean)=>void;
  dispose: ()=>void;
};

function midiToName(n: number): string {
  const pc = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][((n%12)+12)%12];
  const octave = Math.floor(n/12)-1;
  return `${pc}${octave}`;
}

/**
 * Real recorded Yamaha C5 piano samples: Salamander Grand Piano by Alexander Holm (CC BY 3.0).
 * Tone.Sampler repitches between minor-third sample points. This intentionally replaces the
 * oscillator-based pseudo-piano used in v3.
 */
async function createPianoRack(): Promise<InstrumentRack> {
  const room = new Tone.Reverb({decay:1.35,preDelay:0.008,wet:0.075}).toDestination();
  await room.generate();
  const compressor = new Tone.Compressor({threshold:-16,ratio:1.8,attack:0.006,release:0.16}).connect(room);
  const filter = new Tone.Filter({type:'lowpass',frequency:10500,rolloff:-12,Q:0.12}).connect(compressor);

  const sampler = new Tone.Sampler({
    urls:{
      A1:'A1.mp3', C2:'C2.mp3', 'D#2':'Ds2.mp3', 'F#2':'Fs2.mp3', A2:'A2.mp3',
      C3:'C3.mp3', 'D#3':'Ds3.mp3', 'F#3':'Fs3.mp3', A3:'A3.mp3',
      C4:'C4.mp3', 'D#4':'Ds4.mp3', 'F#4':'Fs4.mp3', A4:'A4.mp3',
      C5:'C5.mp3', 'D#5':'Ds5.mp3', 'F#5':'Fs5.mp3', A5:'A5.mp3', C6:'C6.mp3',
    },
    baseUrl:'https://tonejs.github.io/audio/salamander/',
    release:1.15,
    volume:-3,
  }).connect(filter);

  // Do not start the transport until the piano recordings are genuinely decoded and ready.
  await Tone.loaded();

  return {
    trigger:(note,duration,time,velocity)=>{
      sampler.triggerAttackRelease(note,Math.max(0.16,duration),time,Math.min(0.93,velocity));
    },
    dispose:()=>{ sampler.dispose(); filter.dispose(); compressor.dispose(); room.dispose(); },
  };
}

function createSimpleRack(instrument: 'guitar'|'bass'): InstrumentRack {
  const filter = new Tone.Filter({
    type:'lowpass', frequency:instrument==='bass'?1900:5200, rolloff:-12,
  }).toDestination();
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator:{type:instrument==='bass'?'sine':'triangle4'},
    envelope:instrument==='bass'
      ? {attack:0.006,decay:0.19,sustain:0.36,release:0.42}
      : {attack:0.004,decay:0.28,sustain:0.16,release:0.52},
    volume:instrument==='bass'?-6:-10,
  }).connect(filter);
  return {
    trigger:(note,duration,time,velocity)=>synth.triggerAttackRelease(note,duration,time,velocity),
    dispose:()=>{synth.dispose();filter.dispose();},
  };
}

function createMetronome(): MetronomeRack {
  const hp = new Tone.Filter({type:'highpass',frequency:4200,rolloff:-12}).toDestination();
  const noise = new Tone.NoiseSynth({
    noise:{type:'white'},
    envelope:{attack:0.001,decay:0.018,sustain:0,release:0.008},
    volume:-17,
  }).connect(hp);
  const accent = new Tone.Synth({
    oscillator:{type:'sine'},
    envelope:{attack:0.001,decay:0.025,sustain:0,release:0.01},
    volume:-17,
  }).toDestination();
  return {
    trigger:(time,downbeat)=>{
      noise.triggerAttackRelease('64n',time,downbeat?0.72:0.40);
      if(downbeat) accent.triggerAttackRelease('C7','64n',time,0.30);
    },
    dispose:()=>{noise.dispose();accent.dispose();hp.dispose();},
  };
}

export async function startPlayback(params: Params, chart: GeneratedChart, onBar: OnBar): Promise<PlaybackHandle> {
  await Tone.start();
  const transport = Tone.getTransport();
  transport.stop();
  transport.cancel(0);
  transport.position='0:0:0';
  transport.bpm.value=params.bpm;
  transport.timeSignature=4;
  transport.swing=params.groove==='swing' ? Math.max(0,Math.min(1,(params.swing-0.5)*4)) : 0;
  transport.swingSubdivision='8n';

  const rack=params.instrument==='piano' ? await createPianoRack() : createSimpleRack(params.instrument);
  const click=params.metronome ? createMetronome() : null;
  const voicedBars=flattenVoicedBars(chart.bars,params.instrument,params.complexity);

  voicedBars.forEach((events,barIndex)=>{
    transport.schedule(time=>{
      Tone.getDraw().schedule(()=>onBar(barIndex),time);
    },`${barIndex}:0:0`);

    if(click){
      for(let beat=0;beat<4;beat++){
        transport.schedule(time=>click.trigger(time,beat===0),`${barIndex}:${beat}:0`);
      }
    }

    events.forEach(event=>{
      // Crucial rhythmic rule: the chord-change beat is always the first hit.
      const hits=compingHits(event,params.comping,params.seed,barIndex);
      hits.forEach((beat,hitIndex)=>{
        const pos=beatToTransportPosition(barIndex,beat);
        transport.schedule(time=>{
          const remaining=Math.max(0.25,event.startBeat+event.durationBeats-beat);
          const durBeats=params.comping==='sustained'
            ? Math.min(remaining,event.durationBeats*0.92)
            : Math.min(remaining,0.78);
          const dur=durBeats*(60/params.bpm);
          const notes=event.midi.map(midiToName);
          const requestedStrum=params.strum ? params.strumMs/1000 : 0;
          // Large strums make comping sound late. Keep piano spread very tight; guitar may use the full value.
          const strum=params.instrument==='piano' ? Math.min(requestedStrum,0.012) : requestedStrum;
          const velocity=params.instrument==='piano' ? 0.58 : 0.70;
          notes.forEach((note,i)=>{
            const offset=strum>0 ? i*strum : 0;
            rack.trigger(note,dur,time+offset,velocity+((barIndex+hitIndex+i)%4)*0.035);
          });
        },pos);
      });
    });
  });

  let disposed=false;
  const dispose=()=>{
    if(disposed) return;
    disposed=true;
    rack.dispose();
    click?.dispose();
  };

  transport.schedule(time=>{
    Tone.getDraw().schedule(()=>{
      onBar(-1);
      transport.stop();
      setTimeout(dispose,1300);
    },time);
  },`${chart.bars.length}:0:0`);

  transport.start('+0.06');

  return {
    stop:()=>{
      transport.stop();
      transport.cancel(0);
      dispose();
      onBar(-1);
    },
  };
}
