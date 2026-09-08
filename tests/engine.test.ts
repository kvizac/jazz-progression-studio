import { describe, expect, it } from 'vitest';
import { runAcceptanceTests } from '../src/acceptance';
import { buildChart } from '../src/engine';
import type { Params } from '../src/types';

const base: Params = { key:'C',type:'iivi',preset:'classic',choruses:1,bpm:140,groove:'swing',swing:.62,strum:false,strumMs:20,instrument:'piano',complexity:'sevenths',color:0,comping:'sustained',seed:1 };

describe('acceptance requirements',()=>{
  for (const result of runAcceptanceTests()) {
    it(result.name,()=>expect(result.pass,result.detail).toBe(true));
  }
});

describe('generation invariants',()=>{
  it('never truncates a chorus',()=>{
    const chart=buildChart({...base,type:'blues',choruses:7});
    expect(chart.bars).toHaveLength(84);
  });
  it('keeps Rhythm Changes at 32 bars per chorus',()=>{
    const chart=buildChart({...base,type:'rhythm',complexity:'extended',preset:'bebop',color:100,choruses:2});
    expect(chart.bars).toHaveLength(64);
  });
  it('each bar totals exactly four beats',()=>{
    const chart=buildChart({...base,type:'rhythm',complexity:'extended',preset:'bebop',color:100});
    for(const bar of chart.bars) expect(bar.events.reduce((s,e)=>s+e.durationBeats,0)).toBe(4);
  });
});

describe('structural harmony model',()=>{
  it('creates a tonal-center plan before realization',()=>{
    const chart=buildChart({...base,type:'rhythm',preset:'bebop',complexity:'extended',color:72,seed:1977});
    expect(chart.tonalCenters?.map(x=>x.section)).toEqual(['A1','A2','B','A3']);
    expect(chart.tonalCenters?.find(x=>x.section==='B')?.centers.length).toBeGreaterThanOrEqual(4);
  });

  it('records phrase grammar decisions that cover the complete form',()=>{
    const chart=buildChart({...base,type:'blues',preset:'bebop',complexity:'extended',color:75,seed:221});
    expect(chart.phrases?.length).toBe(3);
    expect(chart.phrases?.[0].startBar).toBe(0);
    expect(chart.phrases?.at(-1)?.endBar).toBe(11);
  });

  it('develops A2 instead of copying A1 verbatim at normal color',()=>{
    const chart=buildChart({...base,type:'rhythm',preset:'bebop',complexity:'extended',color:68,seed:1701});
    const a1=chart.bars.slice(0,8).map(x=>x.label).join('|');
    const a2=chart.bars.slice(8,16).map(x=>x.label).join('|');
    expect(a2).not.toBe(a1);
  });

  it('makes A3 recognizably related to A1 below the adventurous range',()=>{
    const chart=buildChart({...base,type:'rhythm',preset:'classic',complexity:'extended',color:62,seed:778});
    const a1Opening=chart.bars.slice(0,4).map(x=>x.label);
    const a3Opening=chart.bars.slice(24,28).map(x=>x.label);
    expect(a3Opening).toEqual(a1Opening);
  });

  it('allows sophisticated harmony with seventh-chord voicings',()=>{
    const chart=buildChart({...base,type:'blues',preset:'bebop',complexity:'sevenths',color:88,seed:29});
    const tokens=chart.bars.flatMap(b=>b.events.map(e=>e.token));
    expect(tokens.some(t=>t.includes('/')||t.includes('alt')||t.includes('°'))).toBe(true);
  });

  it('uses rare chromatic families less aggressively at moderate color',()=>{
    const chart=buildChart({...base,type:'rhythm',preset:'classic',complexity:'extended',color:42,seed:991});
    const tokens=chart.bars.flatMap(b=>b.events.map(e=>e.token));
    const tritoneCount=tokens.filter(t=>t.startsWith('subV')).length;
    expect(tritoneCount).toBeLessThanOrEqual(2);
  });

  it('keeps phrase-level metadata aligned across multiple choruses',()=>{
    const chart=buildChart({...base,type:'rhythm',preset:'bebop',complexity:'extended',color:80,choruses:3,seed:42});
    expect(chart.tonalCenters).toHaveLength(12);
    expect(chart.phrases?.every(p=>p.startBar>=0&&p.endBar<96&&p.endBar>=p.startBar)).toBe(true);
  });
});
