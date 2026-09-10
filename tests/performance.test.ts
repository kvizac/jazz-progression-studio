import { describe,it,expect } from 'vitest';
import { Midi } from '@tonejs/midi';
import { DEFAULT,generate,performance,validateProject } from '../src/studio';
import { EXPRESSION,PERFORMANCE_PRESETS,BASSES,GROOVES } from '../src/performanceSettings';
import { midiBytes } from '../src/studioMidi';
describe('Expressive players',()=>{
 it('migrates v6 saved sessions and rejects invalid new controls',()=>{
  const old=JSON.parse(JSON.stringify(generate(DEFAULT)));
  for(const k of Object.keys(EXPRESSION))delete old.settings[k];
  expect(validateProject(old).settings).toEqual(DEFAULT);
  old.settings.arpRate=3;expect(()=>validateProject(old)).toThrow();
  old.settings.arpRate=2;old.settings.bassGate=NaN;expect(()=>validateProject(old)).toThrow();
 });
 it('keeps every style deterministic, playable and monophonic in bass at extreme controls',()=>{
  for(const groove of Object.keys(GROOVES) as (keyof typeof GROOVES)[])for(const bass of Object.keys(BASSES) as (keyof typeof BASSES)[]){
   const p=generate({...DEFAULT,groove,bass,bars:4,bpm:300,density:100,bassDensity:100,human:100,roll:100,gate:100,bassGate:100,arp:50,arpRate:4,arpOctaves:2,variation:100});
   const ns=performance(p);expect(ns).toEqual(performance(p));
   for(const n of ns){expect(n.beat).toBeGreaterThanOrEqual(0);expect(n.duration).toBeGreaterThan(0);expect(n.beat+n.duration).toBeLessThanOrEqual(16);expect(n.velocity).toBeGreaterThan(0);expect(n.velocity).toBeLessThanOrEqual(1);expect(n.midi).toBeLessThanOrEqual(127);}
   const bn=ns.filter(n=>n.track==='bass');for(let i=1;i<bn.length;i++)expect(bn[i-1].beat+bn[i-1].duration).toBeLessThanOrEqual(bn[i].beat);
  }
 });
 it('changes keyboard expression independently of the bass and harmony',()=>{
  const p=generate({...DEFAULT,bass:'soul'}),before=JSON.stringify(p.cells),a=performance(p),b=performance({...p,settings:{...p.settings,arp:100,arpRate:4,rollDirection:'down',density:100}});
  expect(a.filter(n=>n.track==='bass')).toEqual(b.filter(n=>n.track==='bass'));
  expect(a.filter(n=>n.track==='chords')).not.toEqual(b.filter(n=>n.track==='chords'));
  expect(JSON.stringify(p.cells)).toBe(before);
 });
 it('uses the chosen arpeggio and roll directions and responds to density',()=>{
  const p=generate({...DEFAULT,groove:'held',leftHand:'off',roll:100,human:0,pocket:0,rollDirection:'down'}),ns=performance(p).filter(n=>n.track==='chords'&&n.cellId===p.cells[0].id);
  expect(ns.map(n=>n.midi)).toEqual([...p.cells[0].notes].sort((a,b)=>b-a));
  const a=performance({...p,settings:{...p.settings,groove:'broken',arpPattern:'up',arpRate:4,density:100}}).filter(n=>n.track==='chords'&&n.cellId===p.cells[0].id);
  expect(a.slice(0,p.cells[0].notes.length).map(n=>n.midi)).toEqual([...p.cells[0].notes].sort((a,b)=>a-b));
  expect(performance({...p,settings:{...p.settings,groove:'broken',density:0}}).length).toBeLessThan(a.length+performance(p).length);
 });
 it('preserves exact MIDI notes, dynamics and loop length for all band presets',()=>{
  const signatures=new Set<string>();
  for(const preset of PERFORMANCE_PRESETS){
   const p=generate({...DEFAULT,...preset.settings}),ns=performance(p),m=new Midi(midiBytes(p,ns,[1,5])),ppq=m.header.ppq;
   signatures.add(JSON.stringify(ns));
   const actual=m.tracks.flatMap(t=>t.notes.map(n=>[t.name==='Keys'?'chords':'bass',n.midi,n.ticks,n.durationTicks,Math.round(n.velocity*127)].join(':'))).sort();
   const expected=ns.filter(n=>n.beat>=4&&n.beat<20).map(n=>[n.track,n.midi,Math.round((n.beat-4)*ppq),Math.max(1,Math.round(Math.min(n.duration,20-n.beat)*ppq)),Math.floor(n.velocity*127)].join(':')).sort();
   expect(actual).toEqual(expected);for(const t of m.tracks)expect(t.endOfTrackTicks).toBe(16*ppq);
  }
  expect(signatures.size).toBe(PERFORMANCE_PRESETS.length);
 });
 it('keeps block export independent of expression',()=>{
  const p=generate({...DEFAULT,bass:'roots'}),a=performance(p,'blocks');
  expect(performance({...p,settings:{...p.settings,arp:100,roll:100,density:0,bassGate:0,human:100}},'blocks')).toEqual(a);
 });
});
