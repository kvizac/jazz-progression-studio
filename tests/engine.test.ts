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
