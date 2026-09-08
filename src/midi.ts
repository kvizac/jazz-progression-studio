import { Midi } from '@tonejs/midi';
import type { GeneratedChart, Params } from './types';
import { flattenVoicedBars } from './voicings';

const GM_PROGRAM: Record<Params['instrument'],number> = { piano:0, guitar:24, bass:32 };

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  try { a.click(); }
  finally {
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

export function createMidiBytes(params: Params, chart: GeneratedChart): Uint8Array {
  const midi = new Midi();
  midi.header.setTempo(params.bpm);
  const track = midi.addTrack();
  track.name = 'Jazz Progression';
  track.instrument.number = GM_PROGRAM[params.instrument];

  const ppq = midi.header.ppq;
  const ticksPerBeat = ppq;
  const ticksPerBar = ppq*4;
  const voiced = flattenVoicedBars(chart.bars, params.instrument, params.complexity);

  voiced.forEach((events, barIndex) => {
    events.forEach(event => {
      const baseTick = barIndex*ticksPerBar + Math.round(event.startBeat*ticksPerBeat);
      const eventTicks = Math.round(event.durationBeats*ticksPerBeat);
      const strumTicks = params.strum ? Math.max(1, Math.round((params.strumMs/1000) * (params.bpm/60) * ppq)) : 0;
      event.midi.forEach((note, noteIndex) => {
        const offset = noteIndex*strumTicks;
        track.addNote({
          midi: note,
          ticks: baseTick + offset,
          durationTicks: Math.max(1,eventTicks - offset - Math.round(ppq*0.04)),
          velocity: 0.72 + ((barIndex+noteIndex)%5)*0.035,
        });
      });
    });
  });

  return midi.toArray();
}

export function exportMidi(params: Params, chart: GeneratedChart): void {
  const bytes = createMidiBytes(params,chart);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  saveBlob(new Blob([copy.buffer],{type:'audio/midi'}),'jazz_progression.mid');
}
