import * as Tone from 'tone';
import type { GeneratedChart, Params } from './types';
import { flattenVoicedBars } from './voicings';

export type PlaybackHandle = { stop: () => void };

type OnBar = (index: number) => void;

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

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: params.instrument === 'bass' ? 'sine' : 'triangle' },
    envelope: params.instrument === 'bass'
      ? { attack:0.008, decay:0.14, sustain:0.45, release:0.45 }
      : { attack:0.008, decay:0.12, sustain:0.32, release:0.65 },
    volume: params.instrument === 'bass' ? -5 : -9,
  }).toDestination();

  const voicedBars = flattenVoicedBars(chart.bars, params.instrument, params.complexity);

  voicedBars.forEach((events, barIndex) => {
    transport.schedule(time => {
      Tone.getDraw().schedule(() => onBar(barIndex), time);
    }, `${barIndex}:0:0`);

    events.forEach(event => {
      const localPattern = choosePattern(params, barIndex).filter(b => b >= event.startBeat && b < event.startBeat + event.durationBeats);
      const hits = params.comping === 'sustained' || localPattern.length === 0 ? [event.startBeat] : localPattern;
      hits.forEach((beat, hitIndex) => {
        const pos = beatToPosition(barIndex, beat);
        transport.schedule(time => {
          const maxDurBeats = Math.max(0.3, Math.min(event.durationBeats, params.comping === 'sustained' ? event.durationBeats*.92 : 0.62));
          const dur = maxDurBeats * (60 / params.bpm);
          const notes = event.midi.map(midiToName);
          const strum = params.strum ? params.strumMs/1000 : 0;
          if (strum > 0 && notes.length > 1) {
            notes.forEach((note,i) => synth.triggerAttackRelease(note,dur,time+i*strum,0.72 + ((barIndex+hitIndex+i)%5)*0.035));
          } else {
            synth.triggerAttackRelease(notes,dur,time,0.78 + ((barIndex+hitIndex)%4)*0.035);
          }
        }, pos);
      });
    });
  });

  const endPos = `${chart.bars.length}:0:0`;
  transport.schedule(time => {
    const done = () => { onBar(-1); transport.stop(); setTimeout(() => synth.dispose(), 900); };
    Tone.getDraw().schedule(done,time);
  }, endPos);

  transport.start('+0.05');

  return {
    stop: () => {
      transport.stop();
      transport.cancel(0);
      synth.dispose();
      onBar(-1);
    },
  };
}
