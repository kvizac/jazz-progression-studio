import type { ChordEvent, CompingStyle, HarmonyStyle, Params } from './types';

type PatternSet={four:number[][];two:number[][]};

const STYLE_PATTERNS:Record<HarmonyStyle,Record<Exclude<CompingStyle,'sustained'>,PatternSet>>={
  classic:{
    sparse:{four:[[0,2.5],[0,1.5],[0,3.5],[0,1.5,3.5]],two:[[0],[0,1.5],[0,1],[0]]},
    bebop:{four:[[0,1.5,2.5,3.5],[0,.5,2,3.5],[0,1,2.5,3.5],[0,1.5,3]],two:[[0,1.5],[0,.5],[0,1],[0,.5,1.5]]},
  },
  bebop:{
    sparse:{four:[[0,1.5,3.5],[0,.5,2.5],[0,2,3.5],[0,1.5,2.5]],two:[[0,1.5],[0,.5],[0,1],[0,1.5]]},
    bebop:{four:[[0,.5,1.5,2.5,3.5],[0,1,1.5,3],[0,.5,2,2.5,3.5],[0,1.5,2.5,3]],two:[[0,.5,1.5],[0,1,1.5],[0,.5],[0,1.5]]},
  },
  modern:{
    sparse:{four:[[0,1.5,3],[0,.5,2.5],[0,2,3.5],[0,1,3.5],[0,.5,1.5,3]],two:[[0,1.5],[0,.5],[0,1],[0]]},
    bebop:{four:[[0,.5,1.5,3],[0,1.5,2,3.5],[0,.5,2.5,3.5],[0,1,2.5,3]],two:[[0,.5,1.5],[0,1.5],[0,.5],[0,1]]},
  },
  neosoul:{
    sparse:{four:[[0,.5,2.5],[0,1.5,3],[0,2,3.5],[0,.5,3],[0,1.5,2.5]],two:[[0,.5],[0,1.5],[0],[0,1]]},
    bebop:{four:[[0,.5,1.5,2.5],[0,1.5,2,3.5],[0,.5,2.5,3],[0,1,2.5,3.5]],two:[[0,.5,1.5],[0,1.5],[0,.5],[0,1]]},
  },
  rnb:{
    sparse:{four:[[0,1,2.5],[0,2,3],[0,1.5,3.5],[0,.5,2],[0,1,3.5]],two:[[0,1],[0],[0,.5],[0,1.5]]},
    bebop:{four:[[0,.5,1.5,2.5],[0,1,2,3.5],[0,.5,2,3],[0,1.5,2.5,3.5]],two:[[0,.5,1.5],[0,1],[0,.5],[0,1.5]]},
  },
};

function hash(seed:number,barIndex:number,eventStart:number,salt=0):number{
  let x=(seed ^ Math.imul(barIndex+1,0x9e3779b9) ^ Math.imul(Math.round(eventStart*2)+1,0x85ebca6b) ^ Math.imul(salt+1,0xc2b2ae35))>>>0;
  x^=x>>>16;x=Math.imul(x,0x7feb352d)>>>0;x^=x>>>15;return x>>>0;
}
function unit(seed:number,barIndex:number,eventStart:number,salt:number):number{return hash(seed,barIndex,eventStart,salt)/0xffffffff;}
function halfBeat(value:number):number{return Math.round(value*2)/2;}
function styleOf(params:Pick<Params,'preset'|'style'>):HarmonyStyle{return params.style??params.preset;}

function choosePattern(pool:number[][],seed:number,barIndex:number,eventStart:number):number[]{
  let idx=hash(seed,barIndex,eventStart)%pool.length;
  if(barIndex>0&&pool.length>1){const prev=hash(seed,barIndex-1,eventStart)%pool.length;if(idx===prev)idx=(idx+1+(hash(seed,barIndex,eventStart,7)%(pool.length-1)))%pool.length;}
  return pool[idx];
}

export function compingHits(event:Pick<ChordEvent,'startBeat'|'durationBeats'>,style:CompingStyle,seed:number,barIndex:number,harmonyStyle:HarmonyStyle='classic'):number[]{
  const start=halfBeat(event.startBeat);const duration=Math.max(.5,halfBeat(event.durationBeats));const end=start+duration;
  if(style==='sustained')return[start];
  const set=STYLE_PATTERNS[harmonyStyle][style];const pool=duration<=2.01?set.two:set.four;const relative=choosePattern(pool,seed,barIndex,start);
  const hits=[start,...relative.filter(x=>x>0).map(x=>halfBeat(start+x)).filter(x=>x>start&&x<end-.01)];
  return[...new Set(hits)].sort((a,b)=>a-b);
}

export type PerformanceVariation={timingMs:number;velocityScale:number;durationScale:number;strumScale:number;direction:'up'|'down'};

export function performanceVariation(params:Pick<Params,'seed'|'preset'|'style'|'humanize'|'humanizeAmount'>,barIndex:number,beat:number,hitIndex:number):PerformanceVariation{
  if(params.humanize===false)return{timingMs:0,velocityScale:1,durationScale:1,strumScale:1,direction:'up'};
  const amount=Math.max(0,Math.min(1,(params.humanizeAmount??55)/100));const style=styleOf(params);
  const profile:Record<HarmonyStyle,{timing:number;late:number;velocity:number;duration:number;strum:number}>={
    classic:{timing:8,late:1.5,velocity:.07,duration:.06,strum:.32},bebop:{timing:10,late:1,velocity:.09,duration:.08,strum:.38},modern:{timing:14,late:2.5,velocity:.11,duration:.10,strum:.48},neosoul:{timing:18,late:5,velocity:.13,duration:.12,strum:.60},rnb:{timing:16,late:4.5,velocity:.14,duration:.11,strum:.54},
  };
  const p=profile[style];const r1=unit(params.seed,barIndex,beat,20+hitIndex*5);const r2=unit(params.seed,barIndex,beat,21+hitIndex*5);const r3=unit(params.seed,barIndex,beat,22+hitIndex*5);const r4=unit(params.seed,barIndex,beat,23+hitIndex*5);const r5=unit(params.seed,barIndex,beat,24+hitIndex*5);
  const downbeat=Math.abs(beat)<.01;const backbeat=Math.abs(beat-1)<.01||Math.abs(beat-3)<.01;const offbeat=Math.abs(beat-Math.round(beat))>.01;
  let accent=downbeat ? .07 : 0;if(style==='rnb'&&backbeat)accent+=.08;if(style==='neosoul'&&offbeat)accent+=.055;if(style==='modern'&&offbeat)accent+=.035;
  const timing=Math.max(0,(p.late+(r1-.5)*p.timing)*amount);
  return{timingMs:Math.min(p.timing,timing),velocityScale:Math.max(.76,Math.min(1.22,1+accent*amount+(r2-.5)*2*p.velocity*amount)),durationScale:Math.max(.82,Math.min(1.12,1+(r3-.5)*2*p.duration*amount)),strumScale:Math.max(.20,Math.min(1.35,1+(r4-.5)*2*p.strum*amount)),direction:r5>.62?'down':'up'};
}

export function beatToTransportPosition(bar:number,beat:number):string{const q=halfBeat(beat);const whole=Math.floor(q);const eighth=q-whole>=.5?2:0;return`${bar}:${whole}:${eighth}`;}
export function isOnHalfBeatGrid(beat:number):boolean{return Math.abs(beat*2-Math.round(beat*2))<1e-8;}
