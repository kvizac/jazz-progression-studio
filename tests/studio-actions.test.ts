import { describe,it,expect } from 'vitest';
import { DEFAULT,generate,validateProject,barCount } from '../src/studio';
import { newProgression,signature,changeHarmony,swapChords,chordSuggestions,applySuggestion } from '../src/studioActions';

describe('Composition controls regression',()=>{
 it('generates different harmony on consecutive clicks for every form and tonality, even with triads and no chromatic color',()=>{
  for(const form of ['loop','aaba','blues','rhythm'] as const)for(const mode of ['major','minor'] as const)for(const detail of ['triads','extended'] as const){
   let p=generate({...DEFAULT,form,mode,detail,color:0});
   for(let seed=0;seed<12;seed++){const result=newProgression(p,undefined,seed);expect(result.changed).toBeGreaterThan(0);expect(signature(result.project)).not.toBe(signature(p));expect(validateProject(result.project).settings.mode).toBe(mode);p=result.project;}
  }
 });
 it('allows major and minor changes in every form including rhythm changes',()=>{
  for(const form of ['loop','aaba','blues','rhythm'] as const){const major=generate({...DEFAULT,form,mode:'major'}),minor=changeHarmony(major,{mode:'minor'});expect(minor.settings.mode).toBe('minor');expect(signature(minor)).not.toBe(signature(major));expect(changeHarmony(minor,{mode:'major'}).settings.mode).toBe('major');expect(barCount(minor.settings)).toBe(barCount(major.settings));}
 });
 it('keeps locked bars exact and reports a genuinely blocked generation without changing history data',()=>{
  const p=generate({...DEFAULT,form:'rhythm'});p.cells.filter(c=>c.bar===0).forEach(c=>c.locked=true);const r=newProgression(p,undefined,1);expect(r.project.cells.filter(c=>c.bar===0)).toEqual(p.cells.filter(c=>c.bar===0));
  p.cells.forEach(c=>c.locked=true);const blocked=newProgression(p,undefined,2);expect(blocked.changed).toBe(0);expect(blocked.project).toBe(p);expect(blocked.message).toContain('locked');
 });
 it('varies one selected bar even when the form normally keeps that bar invariant',()=>{
  const p=generate({...DEFAULT,form:'blues',detail:'triads'}),result=newProgression(p,[0,1],3);
  expect(result.changed).toBe(1);expect(result.project.cells.filter(c=>c.bar>0)).toEqual(p.cells.filter(c=>c.bar>0));expect(validateProject(result.project)).toBeTruthy();
 });
 it('swaps chord contents without losing positions, durations or unique IDs',()=>{
  const p=generate(DEFAULT),a=p.cells[0],b=p.cells[1],q=swapChords(p,a.id,b.id);expect(q.cells[0].chord).toEqual(b.chord);expect(q.cells[1].chord).toEqual(a.chord);expect(q.cells.map(c=>[c.id,c.bar,c.beat,c.beats])).toEqual(p.cells.map(c=>[c.id,c.bar,c.beat,c.beats]));expect(validateProject(q)).toBeTruthy();p.cells[0].locked=true;expect(swapChords(p,a.id,b.id)).toBe(p);
 });
 it('suggests and applies usable chords without changing the selected slot length',()=>{
  for(const mode of ['major','minor'] as const){const p=generate({...DEFAULT,mode}),c=p.cells[0],suggestions=chordSuggestions(p,c);expect(suggestions.length).toBeGreaterThan(3);for(const v of suggestions){const q=applySuggestion(p,c,v.chord);expect(q.cells[0].chord).toEqual(v.chord);expect(q.cells[0].beats).toBe(c.beats);expect(validateProject(q)).toBeTruthy();}}
 });
});
