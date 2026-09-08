import type { ChordEvent, CompingStyle } from './types';

const FOUR_BEAT_PATTERNS: Record<Exclude<CompingStyle,'sustained'>, number[][]> = {
  sparse: [
    [0,2.5],
    [0,1.5],
    [0,3.5],
    [0,1.5,3.5],
  ],
  bebop: [
    [0,1.5,2.5,3.5],
    [0,0.5,2,3.5],
    [0,1,2.5,3.5],
    [0,1.5,3],
  ],
};

const TWO_BEAT_PATTERNS: Record<Exclude<CompingStyle,'sustained'>, number[][]> = {
  sparse: [[0],[0],[0,1.5],[0,1]],
  bebop: [[0,1.5],[0,0.5],[0,1],[0,0.5,1.5]],
};

function hash(seed:number,barIndex:number,eventStart:number):number {
  let x=(seed ^ Math.imul(barIndex+1,0x9e3779b9) ^ Math.imul(Math.round(eventStart*2)+1,0x85ebca6b))>>>0;
  x^=x>>>16; x=Math.imul(x,0x7feb352d)>>>0; x^=x>>>15;
  return x>>>0;
}

function choose<T>(pool:T[],seed:number,barIndex:number,eventStart:number):T {
  return pool[hash(seed,barIndex,eventStart)%pool.length];
}

function halfBeat(value:number):number {
  return Math.round(value*2)/2;
}

/**
 * Returns ABSOLUTE beats within the bar. The first hit is always the exact chord-change beat.
 * This prevents the previous bug where a new chord could wait until a later comping offbeat.
 */
export function compingHits(
  event: Pick<ChordEvent,'startBeat'|'durationBeats'>,
  style: CompingStyle,
  seed: number,
  barIndex: number,
): number[] {
  const start=halfBeat(event.startBeat);
  const duration=Math.max(0.5,halfBeat(event.durationBeats));
  const end=start+duration;
  if(style==='sustained') return [start];

  const relativePool=duration<=2.01 ? TWO_BEAT_PATTERNS[style] : FOUR_BEAT_PATTERNS[style];
  const relative=choose(relativePool,seed,barIndex,start);
  const hits=[start,...relative
    .filter(x=>x>0)
    .map(x=>halfBeat(start+x))
    .filter(x=>x>start && x<end-0.01)];
  return [...new Set(hits)].sort((a,b)=>a-b);
}

export function beatToTransportPosition(bar:number,beat:number):string {
  const q=halfBeat(beat);
  const whole=Math.floor(q);
  const eighth=q-whole>=0.5?2:0;
  return `${bar}:${whole}:${eighth}`;
}

export function isOnHalfBeatGrid(beat:number):boolean {
  return Math.abs(beat*2-Math.round(beat*2))<1e-8;
}
