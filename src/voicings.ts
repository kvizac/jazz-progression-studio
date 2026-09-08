import type { ChordQuality, Instrument, ParsedChord, VoicedEvent, ChordEvent, Complexity } from './types';

const TEMPLATES: Partial<Record<ChordQuality, number[][]>> = {
  // Dyas one-hand categories A/B
  maj7: [[4,11,14],[11,16,19]],
  maj6: [[4,9,14],[9,16,19]],
  maj9: [[4,11,14,19],[11,16,21,26]],
  'maj9#11': [[4,11,14,18,21],[11,16,21,26,30]],
  maj69: [[4,9,14,19],[9,16,21,26]],
  min7: [[3,10,14],[10,15,19]],
  min9: [[3,10,14,19],[10,15,19,26]],
  minMaj7: [[3,11,14,19],[11,15,21,26]],
  min69: [[3,9,14,19],[9,15,21,26]],
  dom7: [[4,10,14],[10,16,21]],
  dom9: [[4,10,14,21],[10,16,21,26]],
  dom13: [[4,10,14,21],[10,16,21,26]],
  dom7b9: [[4,10,13,19],[10,13,16,19]],
  'dom7#9': [[4,10,15,20],[10,16,20,27]],
  'dom7#11': [[4,10,14,18,21],[10,16,18,21,26]],
  dom7alt: [[4,8,10,13],[10,13,16,20]],
  dom7sus: [[5,10,14,19],[10,17,21,26]],
  halfDim7: [[3,6,10,12],[10,12,15,18]],
  dim7: [[0,3,6,9],[3,6,9,12]],
  maj: [[0,4,7]], min: [[0,3,7]], domTriad: [[0,4,7]], halfDimTriad:[[0,3,6]], dimTriad:[[0,3,6]],
};

function rootMidiNear(rootPc: number, target: number): number {
  const baseOct = Math.floor(target / 12);
  let best = rootPc + baseOct * 12;
  for (let oct = baseOct - 2; oct <= baseOct + 2; oct++) {
    const n = rootPc + oct * 12;
    if (Math.abs(n - target) < Math.abs(best - target)) best = n;
  }
  return best;
}

function candidateVoicings(chord: ParsedChord, instrument: Instrument, complexity: Complexity): number[][] {
  const templates = TEMPLATES[chord.quality] ?? [[0,4,7]];
  const center = instrument === 'guitar' ? 62 : 60;
  const root = rootMidiNear(chord.rootPc, center - 12);
  const candidates: number[][] = [];

  for (const shape of templates) {
    for (const shift of [-12,0,12]) {
      let notes = shape.map(i => root + i + shift);
      // Guitar stays compact and avoids a duplicated low root. Piano gets a low root to make standalone preview unambiguous.
      if (instrument === 'piano' && complexity !== 'triads') {
        const bassRoot = rootMidiNear(chord.rootPc, 43);
        notes = [bassRoot, ...notes];
      } else if (instrument === 'bass') {
        const bassRoot = rootMidiNear(chord.rootPc, 38);
        notes = complexity === 'extended' ? [bassRoot, bassRoot + 7, bassRoot + 12] : [bassRoot];
      }
      const min = instrument === 'bass' ? 28 : 40;
      const max = instrument === 'guitar' ? 79 : instrument === 'piano' ? 84 : 60;
      if (notes.every(n => n >= min && n <= max)) candidates.push([...new Set(notes)].sort((a,b)=>a-b));
    }
  }
  return candidates.length ? candidates : [[rootMidiNear(chord.rootPc, center)]];
}

function voiceLeadingCost(previous: number[] | null, candidate: number[]): number {
  if (!previous) {
    const center = candidate.reduce((a,b)=>a+b,0) / candidate.length;
    return Math.abs(center - 60) * 0.25 + (candidate[candidate.length-1] - candidate[0]) * 0.04;
  }
  const a = previous.slice(-Math.min(previous.length, candidate.length));
  const b = candidate.slice(-Math.min(previous.length, candidate.length));
  let cost = 0;
  for (let i=0;i<Math.min(a.length,b.length);i++) cost += Math.abs(a[i]-b[i]);
  cost += Math.abs(candidate.length - previous.length) * 3;
  return cost;
}

export function voiceLeadEvents(events: ChordEvent[], instrument: Instrument, complexity: Complexity): VoicedEvent[] {
  let previous: number[] | null = null;
  return events.map(event => {
    const candidates = candidateVoicings(event.chord, instrument, complexity);
    let best = candidates[0];
    let bestCost = Number.POSITIVE_INFINITY;
    for (const c of candidates) {
      const cost = voiceLeadingCost(previous, c);
      if (cost < bestCost) { best = c; bestCost = cost; }
    }
    previous = best;
    return { ...event, midi: best };
  });
}

export function flattenVoicedBars(bars: { events: ChordEvent[] }[], instrument: Instrument, complexity: Complexity): VoicedEvent[][] {
  let previous: number[] | null = null;
  return bars.map(bar => bar.events.map(event => {
    const candidates = candidateVoicings(event.chord, instrument, complexity);
    let best = candidates[0];
    let bestCost = Infinity;
    for (const c of candidates) {
      const cost = voiceLeadingCost(previous, c);
      if (cost < bestCost) { best = c; bestCost = cost; }
    }
    previous = best;
    return { ...event, midi: best };
  }));
}
