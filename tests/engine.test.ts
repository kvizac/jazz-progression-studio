import { describe, expect, it } from 'vitest';
import { runAcceptanceTests } from '../src/acceptance';
import { buildChart } from '../src/engine';
import type { Params } from '../src/types';

const base: Params = { key:'C',type:'iivi',standardForm:false,preset:'classic',choruses:1,bpm:140,groove:'swing',swing:.62,strum:false,strumMs:20,instrument:'piano',complexity:'sevenths',color:0,comping:'sustained',metronome:true,seed:1 };

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
  it('standard mode produces complete 32-bar choruses',()=>{
    const chart=buildChart({...base,standardForm:true,type:'rhythm',complexity:'extended',color:60,choruses:3,seed:9081});
    expect(chart.bars).toHaveLength(96);
    expect(chart.formLength).toBe(32);
  });
  it('standard sections contain planned tonal-center metadata',()=>{
    const chart=buildChart({...base,standardForm:true,type:'rhythm',complexity:'extended',color:64,seed:22331});
    expect(chart.tonalCenters).toHaveLength(4);
    expect(chart.tonalCenters?.every(r=>r.centers.length>=3)).toBe(true);
  });
  it('standard A material returns without literal 32-bar repetition',()=>{
    const chart=buildChart({...base,standardForm:true,type:'rhythm',complexity:'extended',color:56,seed:18021});
    const a1=chart.bars.slice(0,8).map(b=>b.label).join('|');
    const last=chart.bars.slice(24,32).map(b=>b.label).join('|');
    expect(last).not.toBe(a1);
    expect(chart.phrases?.some(p=>p.section==='A1')).toBe(true);
  });
  it('standard bridge is harmonically distinct from A1',()=>{
    const chart=buildChart({...base,standardForm:true,type:'rhythm',complexity:'extended',color:58,seed:1701});
    const summary=chart.variantNames[0];
    if(summary.startsWith('AABA')){
      const a1=chart.bars.slice(0,8).map(b=>b.label).join('|');
      const bridge=chart.bars.slice(16,24).map(b=>b.label).join('|');
      expect(bridge).not.toBe(a1);
    } else {
      const a1=chart.bars.slice(0,8).map(b=>b.label).join('|');
      const b=chart.bars.slice(8,16).map(b=>b.label).join('|');
      expect(b).not.toBe(a1);
    }
  });
});
