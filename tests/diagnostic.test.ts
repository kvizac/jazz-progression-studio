import { describe, expect, it } from 'vitest';
import { buildChart } from '../src/engine';
import { flattenVoicedBars, validatePianoVoicing } from '../src/voicings';
import { compingHits, isOnHalfBeatGrid } from '../src/rhythm';
import type { KeyName, Params } from '../src/types';

const base: Params = {
  key:'C', type:'rhythm', standardForm:true, preset:'classic', choruses:1, bpm:136,
  groove:'swing', swing:.62, strum:false, strumMs:10, instrument:'piano',
  complexity:'extended', color:56, comping:'sparse', metronome:true, seed:1,
};

function inspect(params: Params) {
  const chart=buildChart(params);
  const voiced=flattenVoicedBars(chart.bars,'piano',params.complexity);
  const flat=voiced.flat();
  const noteCounts=flat.map(e=>e.midi.length);
  const spans=flat.map(e=>Math.max(...e.midi)-Math.min(...e.midi));
  const splitBars=chart.bars.filter(b=>b.events.length===2).length;
  const roots=new Set(chart.bars.flatMap(b=>b.events.map(e=>e.chord.rootPc))).size;
  const symbols=new Set(chart.bars.flatMap(b=>b.events.map(e=>e.chord.symbol))).size;
  const altered=chart.bars.flatMap(b=>b.events).filter(e=>e.chord.quality==='dom7alt').length;
  return{chart,voiced,minNotes:Math.min(...noteCounts),maxSpan:Math.max(...spans),splitBars,roots,symbols,altered};
}

describe('representative generated forms',()=>{
  for(const [key,seed] of [['C',11],['Eb',42],['Bb',1701],['F',8021]] as const){
    it(`prints and validates ${key} seed ${seed}`,()=>{
      const r=inspect({...base,key,seed});
      console.log(`\nQUALITY SAMPLE ${key} seed ${seed}`);
      console.log(r.chart.variantNames[0]);
      console.log(r.chart.bars.map((b,i)=>`${i+1}:${b.label}`).join(' | '));
      console.log(`minNotes=${r.minNotes}; maxSpan=${r.maxSpan}; splitBars=${r.splitBars}; roots=${r.roots}; symbols=${r.symbols}; alt=${r.altered}`);
      expect(r.chart.bars).toHaveLength(32);
      expect(r.minNotes).toBeGreaterThanOrEqual(4);
      expect(r.maxSpan).toBeLessThanOrEqual(39);
      expect(r.splitBars).toBeGreaterThanOrEqual(2);
      expect(r.splitBars).toBeLessThanOrEqual(12);
      expect(r.roots).toBeGreaterThanOrEqual(6);
      expect(r.symbols).toBeGreaterThanOrEqual(10);
      expect(r.altered).toBeLessThanOrEqual(6);
    });
  }
});

describe('matrix quality gate across keys and seeds',()=>{
  const keys:KeyName[]=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  for(const key of keys){
    it(`${key}: 20 generated standards stay playable and rhythmically sane`,()=>{
      for(let n=0;n<20;n++){
        const params={...base,key,seed:1009+n*7919,color:30+(n%7)*8,preset:(n%3===0?'bebop':'classic') as Params['preset']};
        const r=inspect(params);
        expect(r.chart.bars,`bars seed ${params.seed}`).toHaveLength(32);
        expect(r.splitBars,`density seed ${params.seed}`).toBeLessThanOrEqual(12);
        expect(r.roots,`root variety seed ${params.seed}`).toBeGreaterThanOrEqual(6);
        expect(r.symbols,`symbol variety seed ${params.seed}`).toBeGreaterThanOrEqual(10);

        for(const events of r.voiced){
          for(const event of events){
            const check=validatePianoVoicing(event.midi);
            expect(check.playable,`${key} ${event.chord.symbol}: ${check.reason}`).toBe(true);
          }
        }

        for(let barIndex=0;barIndex<r.chart.bars.length;barIndex++){
          const bar=r.chart.bars[barIndex];
          expect(bar.events.length,`too many chords bar ${barIndex+1}`).toBeLessThanOrEqual(2);
          for(const event of bar.events){
            expect(isOnHalfBeatGrid(event.startBeat),`off-grid change ${event.startBeat}`).toBe(true);
            const hits=compingHits(event,params.comping,params.seed,barIndex);
            expect(hits[0],`missing chord-change onset bar ${barIndex+1}`).toBe(event.startBeat);
            for(const hit of hits){
              expect(isOnHalfBeatGrid(hit),`off-grid comp hit ${hit}`).toBe(true);
              expect(hit).toBeGreaterThanOrEqual(event.startBeat);
              expect(hit).toBeLessThan(event.startBeat+event.durationBeats);
            }
          }
        }
      }
    });
  }
});
