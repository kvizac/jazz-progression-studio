import { describe, expect, it } from 'vitest';
import { buildChart } from '../src/engine';
import { flattenVoicedBars, validatePianoVoicing } from '../src/voicings';
import { compingHits, isOnHalfBeatGrid, performanceVariation } from '../src/rhythm';
import type { KeyName, Params, Preset } from '../src/types';

const base: Params = {
  key:'C', type:'rhythm', standardForm:true, preset:'modern', choruses:1, bpm:124,
  groove:'swing', swing:.62, strum:true, strumMs:12, instrument:'piano',
  complexity:'extended', color:52, comping:'sparse', metronome:true,
  humanize:true, humanizeAmount:58, seed:1,
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

const styles:Preset[]=['classic','bebop','modern','neosoul','rnb'];

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

describe('matrix quality gate across keys styles and seeds',()=>{
  const keys:KeyName[]=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  for(const key of keys){
    it(`${key}: all five styles stay playable and rhythmically sane`,()=>{
      for(const preset of styles){
        for(let n=0;n<8;n++){
          const params={...base,key,preset,seed:1009+n*7919,color:28+(n%7)*9};
          const r=inspect(params);
          expect(r.chart.bars,`${preset} bars seed ${params.seed}`).toHaveLength(32);
          expect(r.splitBars,`${preset} density seed ${params.seed}`).toBeLessThanOrEqual(12);
          expect(r.roots,`${preset} root variety seed ${params.seed}`).toBeGreaterThanOrEqual(6);
          expect(r.symbols,`${preset} symbol variety seed ${params.seed}`).toBeGreaterThanOrEqual(9);
          for(const events of r.voiced){
            for(const event of events){
              const check=validatePianoVoicing(event.midi);
              expect(check.playable,`${preset} ${key} ${event.chord.symbol}: ${check.reason}`).toBe(true);
            }
          }
          for(let barIndex=0;barIndex<r.chart.bars.length;barIndex++){
            const bar=r.chart.bars[barIndex];
            expect(bar.events.length,`${preset} too many chords bar ${barIndex+1}`).toBeLessThanOrEqual(2);
            for(const event of bar.events){
              expect(isOnHalfBeatGrid(event.startBeat),`${preset} off-grid change ${event.startBeat}`).toBe(true);
              const hits=compingHits(event,params.comping,params.seed,barIndex,preset);
              expect(hits[0],`${preset} missing harmonic anchor bar ${barIndex+1}`).toBe(event.startBeat);
              for(const hit of hits){
                expect(isOnHalfBeatGrid(hit),`${preset} off-grid comp hit ${hit}`).toBe(true);
                expect(hit).toBeGreaterThanOrEqual(event.startBeat);
                expect(hit).toBeLessThan(event.startBeat+event.durationBeats);
              }
            }
          }
        }
      }
    });
  }
});

describe('style and performance behavior',()=>{
  it('same seed produces materially different harmony across styles',()=>{
    const forms=styles.map(preset=>buildChart({...base,preset,key:'Db',seed:44191}).bars.map(b=>b.label).join('|'));
    expect(new Set(forms).size).toBeGreaterThanOrEqual(3);
  });
  it('each style varies its comping patterns across a chorus',()=>{
    const event={startBeat:0,durationBeats:4};
    for(const preset of styles){
      const patterns=new Set(Array.from({length:16},(_,bar)=>compingHits(event,'sparse',7717,bar,preset).join(',')));
      expect(patterns.size,`${preset} rhythm vocabulary`).toBeGreaterThanOrEqual(3);
    }
  });
  it('humanization is bounded and deterministic',()=>{
    for(const preset of styles){
      const params={...base,preset,humanize:true,humanizeAmount:100};
      const a=performanceVariation(params,7,2.5,1);
      const b=performanceVariation(params,7,2.5,1);
      expect(a).toEqual(b);
      expect(a.timingMs).toBeGreaterThanOrEqual(0);
      expect(a.timingMs).toBeLessThanOrEqual(18);
      expect(a.velocityScale).toBeGreaterThanOrEqual(.76);
      expect(a.velocityScale).toBeLessThanOrEqual(1.22);
      expect(a.durationScale).toBeGreaterThanOrEqual(.82);
      expect(a.durationScale).toBeLessThanOrEqual(1.12);
      expect(a.strumScale).toBeGreaterThanOrEqual(.20);
      expect(a.strumScale).toBeLessThanOrEqual(1.35);
    }
  });
  it('humanize off returns exact neutral performance',()=>{
    expect(performanceVariation({...base,humanize:false},3,1.5,0)).toEqual({timingMs:0,velocityScale:1,durationScale:1,strumScale:1,direction:'up'});
  });
});
