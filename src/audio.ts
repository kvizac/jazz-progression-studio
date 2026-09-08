import * as Tone from 'tone';
import type { GeneratedChart, Params } from './types';
import { flattenVoicedBars } from './voicings';

export type PlaybackHandle = { stop: () => void };
type OnBar = (index: number) => void;

type InstrumentRack = {
  trigger: (note:string,duration:number,time:number,velocity:number)=>void;
  dispose: ()=>void;
};

const PATTERNS = {
  sustained: [[0]],
  sparse: [[0,2.5],[0.5,2.5],[0,1.5,3.5],[1,3]],
  bebop: [[0,1.5,2.5,3.5],[0.5,1.5,3],[0,1,2.5,3.5],[0.5,2,3]],
} as const;

function choosePattern(params: Params, barIndex: number): readonly number[] {
  const pool = PATTERNS[params.comping];
  const idx = Math.abs((params.seed * 31 + barIndex * 17) % pool.length);
  return pool[idx];
}

function beatToPosition(bar: number, beat: number): string {
  const wholeBeat = Math.floor(beat);
  const eighth = beat - wholeBeat >= 0.5 ? 2 : 0;
  return `${bar}:${wholeBeat}:${eighth}`;
}

function midiToName(n: number): string {
  const pc = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][n%12];
  const octave = Math.floor(n/12)-1;
  return `${pc}${octave}`;
}

async function createPianoRack(): Promise<InstrumentRack> {
  // Fully offline piano-like model: a harmonic body plus a short FM hammer transient.
  // It is not a sampled grand piano, but it removes the obvious triangle-wave synth character
  // without introducing runtime network calls or external sample dependencies.
  const room = new Tone.Reverb({ decay:2.0, preDelay:0.012, wet:0.13 }).toDestination();
  await room.generate();
  const compressor = new Tone.Compressor({ threshold:-20, ratio:2.4, attack:0.004, release:0.18 }).connect(room);
  const filter = new Tone.Filter({ type:'lowpass', frequency:7600, rolloff:-12, Q:0.25 }).connect(compressor);

  const body = new Tone.PolySynth(Tone.Synth, {
    oscillator:{ type:'triangle8' },
    envelope:{ attack:0.003, decay:1.05, sustain:0.055, release:1.55 },
    volume:-9,
  }).connect(filter);

  const hammer = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity:3.01,
    modulationIndex:1.35,
    oscillator:{ type:'sine' },
    modulation:{ type:'triangle' },
    envelope:{ attack:0.001, decay:0.16, sustain:0.0, release:0.08 },
    modulationEnvelope:{ attack:0.001, decay:0.055, sustain:0.0, release:0.025 },
    volume:-19,
  }).connect(filter);

  return {
    trigger:(note,duration,time,velocity)=>{
      const pianoDur=Math.max(0.18,duration);
      body.triggerAttackRelease(note,pianoDur,time,Math.min(0.92,velocity));
      hammer.triggerAttackRelease(note,Math.min(0.12,pianoDur),time,Math.min(0.72,velocity*0.72));
    },
    dispose:()=>{ body.dispose(); hammer.dispose(); filter.dispose(); compressor.dispose(); room.dispose(); },
  };
}

function createSimpleRack(instrument: 'guitar'|'bass'): InstrumentRack {
  const filter = new Tone.Filter({
    type:'lowpass',
    frequency:instrument==='bass'?1900:5200,
    rolloff:-12,
  }).toDestination();
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator:{ type:instrument==='bass'?'sine':'triangle4' },
    envelope:instrument==='bass'
      ? { attack:0.006, decay:0.19, sustain:0.36, release:0.42 }
      : { attack:0.004, decay:0.28, sustain:0.16, release:0.52 },
    volume:instrument==='bass'?-6:-10,
  }).connect(filter);
  return {
    trigger:(note,duration,time,velocity)=>synth.triggerAttackRelease(note,duration,time,velocity),
    dispose:()=>{ synth.dispose(); filter.dispose(); },
  };
}

function createMetronome(): Tone.MembraneSynth {
  return new Tone.MembraneSynth({
    pitchDecay:0.004,
    octaves:2.2,
    oscillator:{type:'sine'},
    envelope:{attack:0.001,decay:0.035,sustain:0,release:0.02},
    volume:-14,
  }).toDestination();
}

export async function startPlayback(params: Params, chart: GeneratedChart, onBar: OnBar): Promise<PlaybackHandle> {
  await Tone.start();
  const transport = Tone.getTransport();
  transport.stop();
  transport.cancel(0);
  transport.position = '0:0:0';
  transport.bpm.value = params.bpm;
  transport.timeSignature = 4;
  transport.swing = params.groove === 'swing' ? Math.max(0,Math.min(1,(params.swing-0.5)*4)) : 0;
  transport.swingSubdivision = '8n';

  const rack = params.instrument==='piano' ? await createPianoRack() : createSimpleRack(params.instrument);
  const click = params.metronome ? createMetronome() : null;
  const voicedBars = flattenVoicedBars(chart.bars, params.instrument, params.complexity);

  voicedBars.forEach((events, barIndex) => {
    transport.schedule(time => {
      Tone.getDraw().schedule(() => onBar(barIndex), time);
    }, `${barIndex}:0:0`);

    if(click){
      for(let beat=0;beat<4;beat++){
        transport.schedule(time=>{
          click.triggerAttackRelease(beat===0?'C7':'G6','32n',time,beat===0?0.82:0.46);
        },`${barIndex}:${beat}:0`);
      }
    }

    events.forEach(event => {
      const localPattern = choosePattern(params, barIndex).filter(b => b >= event.startBeat && b < event.startBeat + event.durationBeats);
      const hits = params.comping === 'sustained' || localPattern.length === 0 ? [event.startBeat] : localPattern;
      hits.forEach((beat, hitIndex) => {
        const pos = beatToPosition(barIndex, beat);
        transport.schedule(time => {
          const maxDurBeats = Math.max(0.3, Math.min(event.durationBeats, params.comping === 'sustained' ? event.durationBeats*.88 : 0.72));
          const dur = maxDurBeats * (60 / params.bpm);
          const notes = event.midi.map(midiToName);
          const strum = params.strum ? params.strumMs/1000 : 0;
          const baseVelocity = params.instrument==='piano' ? 0.58 : 0.72;
          if (strum > 0 && notes.length > 1) {
            notes.forEach((note,i) => rack.trigger(note,dur,time+i*strum,baseVelocity + ((barIndex+hitIndex+i)%5)*0.035));
          } else {
            notes.forEach((note,i)=>rack.trigger(note,dur,time,baseVelocity + ((barIndex+hitIndex+i)%4)*0.03));
          }
        }, pos);
      });
    });
  });

  const dispose = () => {
    rack.dispose();
    click?.dispose();
  };

  const endPos = `${chart.bars.length}:0:0`;
  transport.schedule(time => {
    const done = () => { onBar(-1); transport.stop(); setTimeout(dispose, 1500); };
    Tone.getDraw().schedule(done,time);
  }, endPos);

  transport.start('+0.05');

  return {
    stop: () => {
      transport.stop();
      transport.cancel(0);
      dispose();
      onBar(-1);
    },
  };
}
