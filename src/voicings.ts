import type { ChordQuality, Instrument, ParsedChord, VoicedEvent, ChordEvent, Complexity } from './types';

/**
 * Upper-structure intervals are intentionally guide-tone first. 3rds and 7ths are present
 * in all seventh/extended piano shapes; colors are added above them rather than replacing
 * the harmonic identity. Two alternatives roughly correspond to common A/B jazz-piano
 * voicing families and give the voice-leading selector something musical to choose from.
 */
const UPPER_SHAPES: Record<ChordQuality, number[][]> = {
  maj: [[4,7,12],[7,12,16]],
  min: [[3,7,12],[7,12,15]],
  domTriad: [[4,7,12],[7,10,16]],
  halfDimTriad: [[3,6,10],[6,10,15]],
  dimTriad: [[3,6,9],[6,9,12]],

  maj7: [[4,11,14,19],[11,16,21,26]],
  maj6: [[4,9,14,19],[9,16,21,26]],
  maj9: [[4,11,14,19],[11,16,21,26]],
  'maj9#11': [[4,11,14,18,21],[11,16,18,21,26]],
  maj69: [[4,9,14,19],[9,16,21,26]],

  min7: [[3,10,14,19],[10,15,19,26]],
  min9: [[3,10,14,19],[10,15,19,26]],
  minMaj7: [[3,11,14,19],[11,15,21,26]],
  min69: [[3,9,14,19],[9,15,21,26]],

  dom7: [[4,10,14,21],[10,16,21,26]],
  dom9: [[4,10,14,21],[10,16,21,26]],
  dom13: [[4,10,14,21],[10,16,21,26]],
  dom7b9: [[4,10,13,19],[10,13,16,21]],
  'dom7#9': [[4,10,15,20],[10,15,16,20]],
  'dom7#11': [[4,10,14,18,21],[10,16,18,21,26]],
  dom7alt: [[4,8,10,13],[10,13,16,20]],
  dom7sus: [[5,10,14,19],[10,17,21,26]],

  halfDim7: [[3,6,10,14],[10,15,18,24]],
  dim7: [[0,3,6,9],[3,6,9,12]],
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

function normalizeUpper(notes: number[], low = 52, high = 79): number[] {
  const out = notes.map(n => {
    let x = n;
    while (x < low) x += 12;
    while (x > high) x -= 12;
    return x;
  }).sort((a,b)=>a-b);

  // If octave normalization collapsed two notes to the same pitch, move the later voice up.
  for (let i=1;i<out.length;i++) {
    while (out[i] <= out[i-1]) out[i] += 12;
  }
  return out;
}

function pianoCandidates(chord: ParsedChord, complexity: Complexity): number[][] {
  const bass = rootMidiNear(chord.rootPc, 43); // roughly E2–B2 / low C3 area
  const shapes = UPPER_SHAPES[chord.quality] ?? UPPER_SHAPES.dom7;
  const candidates: number[][] = [];

  for (const shape of shapes) {
    for (const rootTarget of [43,48,52,55]) {
      const root = rootMidiNear(chord.rootPc, rootTarget);
      let upper = normalizeUpper(shape.map(i => root + i));

      // Triads still sound like a pianist: root in LH plus a complete RH triad/extension.
      if (complexity === 'triads' && upper.length < 3) {
        upper = normalizeUpper([root+4,root+7,root+12]);
      }

      // Keep clear space between LH root and RH voicing; no mud around middle C.
      if (upper[0] - bass < 7) upper = upper.map(n=>n+12);
      const notes = [bass, ...upper].filter((n,i,a)=>i===0 || n!==a[i-1]);
      const span = notes[notes.length-1] - notes[0];
      if (notes.length >= 4 && notes[0] >= 33 && notes[notes.length-1] <= 84 && span <= 39) {
        candidates.push(notes);
      }
    }
  }

  if (candidates.length) return candidates;

  // This is deliberately a FULL VOICING fallback, never the old one-note root fallback.
  // It uses root + guide tones + fifth/ninth in a safe two-hand register.
  const root = rootMidiNear(chord.rootPc, 48);
  const fallbackShape = shapes[0] ?? [4,10,14,19];
  let upper = normalizeUpper(fallbackShape.slice(0,Math.max(3,Math.min(4,fallbackShape.length))).map(i=>root+i));
  while (upper.length < 3) upper.push(upper[upper.length-1] + 5);
  if (upper[0] - bass < 7) upper = upper.map(n=>n+12);
  return [[bass,...upper].slice(0,5)];
}

function guitarCandidates(chord: ParsedChord): number[][] {
  const shapes = UPPER_SHAPES[chord.quality] ?? UPPER_SHAPES.dom7;
  const candidates: number[][] = [];
  for (const shape of shapes) {
    for (const target of [48,52,55]) {
      const root = rootMidiNear(chord.rootPc,target);
      const notes = normalizeUpper(shape.slice(0,4).map(i=>root+i),48,76);
      const span = notes[notes.length-1]-notes[0];
      if (notes.length>=3 && notes[0]>=45 && notes[notes.length-1]<=79 && span<=19) candidates.push(notes);
    }
  }
  if (candidates.length) return candidates;
  const r=rootMidiNear(chord.rootPc,52);
  return [[r,r+4,r+7,r+10].filter(n=>n<=79)];
}

function bassCandidates(chord: ParsedChord, complexity: Complexity): number[][] {
  const root = rootMidiNear(chord.rootPc,38);
  return complexity==='extended' ? [[root,root+7,root+12]] : [[root]];
}

function candidateVoicings(chord: ParsedChord, instrument: Instrument, complexity: Complexity): number[][] {
  if (instrument==='piano') return pianoCandidates(chord,complexity);
  if (instrument==='guitar') return guitarCandidates(chord);
  return bassCandidates(chord,complexity);
}

function voiceLeadingCost(previous: number[] | null, candidate: number[]): number {
  if (!previous) {
    const upper = candidate.slice(1);
    const center = upper.reduce((a,b)=>a+b,0) / Math.max(1,upper.length);
    return Math.abs(center-64)*0.35 + (candidate[candidate.length-1]-candidate[0])*0.03;
  }

  // Treat the bass independently; compare upper voices by nearest ordered voice.
  const prevUpper = previous.slice(previous.length>3?1:0);
  const nextUpper = candidate.slice(candidate.length>3?1:0);
  const count = Math.min(prevUpper.length,nextUpper.length);
  let cost = Math.abs(candidate[0]-previous[0]) * 0.20;
  for (let i=0;i<count;i++) cost += Math.abs(prevUpper[i]-nextUpper[i]);
  cost += Math.abs(prevUpper.length-nextUpper.length)*2.5;

  // Penalize awkward RH leaps and unnecessarily huge spreads.
  for (let i=1;i<nextUpper.length;i++) {
    const gap=nextUpper[i]-nextUpper[i-1];
    if (gap>12) cost += (gap-12)*1.8;
  }
  const span=candidate[candidate.length-1]-candidate[0];
  if(span>31) cost+=(span-31)*0.35;
  return cost;
}

export function voiceLeadEvents(events: ChordEvent[], instrument: Instrument, complexity: Complexity): VoicedEvent[] {
  let previous: number[] | null = null;
  return events.map(event => {
    const candidates = candidateVoicings(event.chord,instrument,complexity);
    let best=candidates[0];
    let bestCost=Number.POSITIVE_INFINITY;
    for(const candidate of candidates){
      const cost=voiceLeadingCost(previous,candidate);
      if(cost<bestCost){ best=candidate; bestCost=cost; }
    }
    previous=best;
    return {...event,midi:best};
  });
}

export function flattenVoicedBars(bars: { events: ChordEvent[] }[], instrument: Instrument, complexity: Complexity): VoicedEvent[][] {
  let previous: number[] | null = null;
  return bars.map(bar=>bar.events.map(event=>{
    const candidates=candidateVoicings(event.chord,instrument,complexity);
    let best=candidates[0];
    let bestCost=Number.POSITIVE_INFINITY;
    for(const candidate of candidates){
      const cost=voiceLeadingCost(previous,candidate);
      if(cost<bestCost){ best=candidate; bestCost=cost; }
    }
    previous=best;
    return {...event,midi:best};
  }));
}

/** Exported only for automated quality diagnostics. */
export function validatePianoVoicing(midi:number[]): { playable:boolean; reason:string } {
  if(midi.length<4) return {playable:false,reason:`only ${midi.length} notes`};
  if(midi.some(n=>n<33||n>84)) return {playable:false,reason:'outside playable preview range'};
  const span=Math.max(...midi)-Math.min(...midi);
  if(span>39) return {playable:false,reason:`span ${span} semitones`};
  return {playable:true,reason:'ok'};
}
