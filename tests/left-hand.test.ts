import { describe,it,expect } from 'vitest';
import { Midi } from '@tonejs/midi';
import { DEFAULT,KEYS,generate,performance,validateProject,INTERVALS } from '../src/studio';
import { handVoicings } from '../src/leftHand';
import { midiBytes } from '../src/studioMidi';
describe('Two-handed keyboard and electric instruments',()=>{
 it('defaults to warm electric piano with subtle tremolo and an independent left hand',()=>{
  expect(DEFAULT.sound).toBe('electric');expect(DEFAULT.leftHand).toBe('auto');expect(DEFAULT.tremoloDepth).toBe(22);expect(DEFAULT.tremoloRate).toBe(4);
  expect(performance(generate(DEFAULT)).some(n=>n.hand==='left')).toBe(true);
 });
 it('uses playable, separated chord-tone grips in both tonalities and every key',()=>{
  for(const key of KEYS)for(const mode of ['major','minor'] as const)for(const bass of ['off','soul'] as const){
   const p=generate({...DEFAULT,key,mode,bass});let previous:number[]=[];
   for(const c of p.cells){const h=handVoicings(c,p.settings,previous),pcs=INTERVALS[c.chord.quality].map(i=>(i+c.chord.rootPc)%12);
    expect(h.left.length).toBeGreaterThan(0);expect(h.left.length).toBeLessThanOrEqual(2);expect(Math.max(...h.left)-Math.min(...h.left)).toBeLessThanOrEqual(12);expect(Math.max(...h.left)).toBeLessThan(Math.min(...h.right));
    expect([...h.left,...h.right].every(n=>pcs.includes(n%12))).toBe(true);expect(h.left.every(n=>n>=(bass==='off'?36:46))).toBe(true);previous=h.left;
   }
  }
 });
 it('preserves locked right-hand notes and lets the left hand be switched off',()=>{
  const p=generate(DEFAULT);p.cells[0].locked=true;
  expect(handVoicings(p.cells[0],p.settings,[]).right).toEqual(p.cells[0].notes);
  const off={...p,settings:{...p.settings,leftHand:'off' as const}};expect(performance(off).some(n=>n.hand==='left')).toBe(false);
  expect(handVoicings(p.cells[1],off.settings,[]).right).toEqual(p.cells[1].notes);
 });
 it('keeps the bass independent and exports both hands on the existing Keys track',()=>{
  const p=generate(DEFAULT),notes=performance(p),off=performance({...p,settings:{...p.settings,leftHand:'off'}});
  expect(notes.filter(n=>n.track==='bass')).toEqual(off.filter(n=>n.track==='bass'));
  const midi=new Midi(midiBytes(p,notes)),keys=midi.tracks.find(t=>t.name==='Keys')!,bass=midi.tracks.find(t=>t.name==='Bass')!;
  expect(keys.notes.length).toBe(notes.filter(n=>n.track==='chords').length);expect(bass.instrument.number).toBe(33);expect(keys.instrument.number).toBe(4);
  expect(performance({...p,settings:{...p.settings,tremoloDepth:90,tremoloRate:7}})).toEqual(notes);
 });
 it('migrates missing controls, validates their ranges and responds to left-hand level',()=>{
  const p=generate(DEFAULT),raw=JSON.parse(JSON.stringify(p));delete raw.settings.leftHand;delete raw.settings.tremoloDepth;
  expect(validateProject(raw).settings.leftHand).toBe('auto');expect(validateProject(raw).settings.tremoloDepth).toBe(22);
  raw.settings.tremoloRate=0;expect(()=>validateProject(raw)).toThrow();
  expect(performance({...p,settings:{...p.settings,leftLevel:0}}).some(n=>n.hand==='left')).toBe(false);
 });
});
