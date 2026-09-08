import { describe, expect, it } from 'vitest';
import { buildChart } from '../src/engine';
import { flattenVoicedBars } from '../src/voicings';
import type { Params } from '../src/types';

const base: Params = {
  key:'C', type:'rhythm', standardForm:true, preset:'classic', choruses:1, bpm:136,
  groove:'swing', swing:.62, strum:true, strumMs:18, instrument:'piano',
  complexity:'extended', color:56, comping:'sparse', metronome:true, seed:1,
};

function inspect(params: Params) {
  const chart = buildChart(params);
  const voiced = flattenVoicedBars(chart.bars, 'piano', params.complexity);
  const noteCounts = voiced.flat().map(e => e.midi.length);
  const spans = voiced.flat().map(e => Math.max(...e.midi)-Math.min(...e.midi));
  const starts = [...new Set(chart.bars.flatMap(b => b.events.map(e => e.startBeat)))].sort((a,b)=>a-b);
  return {
    chart,
    minNotes: Math.min(...noteCounts),
    maxSpan: Math.max(...spans),
    starts,
  };
}

describe('generated form diagnostics', () => {
  for (const [key,seed] of [['C',11],['Eb',42],['Bb',1701],['F',8021]] as const) {
    it(`prints ${key} seed ${seed}`, () => {
      const r = inspect({...base,key,seed});
      console.log(`\nDIAGNOSTIC ${key} seed ${seed}`);
      console.log(r.chart.variantNames[0]);
      console.log(r.chart.bars.map((b,i)=>`${i+1}:${b.label}`).join(' | '));
      console.log(`min piano notes=${r.minNotes}; max span=${r.maxSpan}; starts=${r.starts.join(',')}`);
      expect(r.chart.bars).toHaveLength(32);
    });
  }
});
