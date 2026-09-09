import { describe,it,expect } from 'vitest';
import { Midi } from '@tonejs/midi';
import { DEFAULT,KEYS,STYLES,INTERVALS,generate,performance,revoice,transpose,barCount,validateProject,makeChord } from '../src/studio';
import type { Settings } from '../src/studio';
import { midiBytes } from '../src/studioMidi';

describe('Producer workflow',()=>{
 it('generates continuous valid phrases across every key, style, tonality and form',()=>{
 for(const key of KEYS)for(const style of Object.keys(STYLES) as Settings['style'][])for(const mode of ['major','minor'] as const)for(const form of ['loop','aaba','blues','rhythm'] as const){
 const p=generate({...DEFAULT,key,style,mode,form,seed:17,color:78});
 expect(validateProject(p).cells.length).toBe(p.cells.length);
 expect(p.cells.at(-1)!.bar).toBe(barCount(p.settings)-1);
 for(const c of p.cells){expect(c.notes.length).toBeGreaterThanOrEqual(3);expect(c.notes.every(n=>n>=48&&n<=84)).toBe(true);const pcs=new Set(INTERVALS[c.chord.quality].map(n=>(n+c.chord.rootPc)%12));expect(c.notes.every(n=>pcs.has(n%12))).toBe(true);}
 }
 });
 it('preserves locked custom bars, notes and rhythm during regeneration',()=>{const p=generate(DEFAULT);p.cells[0]={...p.cells[0],locked:true,notes:[48,55,60,64],chord:makeChord('C','maj7')};const next=generate({...DEFAULT,seed:78118},p.cells);expect(next.cells.filter(c=>c.bar===0)).toEqual(p.cells.filter(c=>c.bar===0));});
 it('transposes edited notes and slash bass without replacing the progression',()=>{const p=generate(DEFAULT);p.cells[0].bassPc=2;const next=transpose(p,'G');expect(next.cells[0].notes).toEqual(p.cells[0].notes.map(n=>n+2));expect(next.cells[0].bassPc).toBe(4);expect(next.cells.length).toBe(p.cells.length);});
 it('voices every supported quality in all keys without invented tones',()=>{for(const q of Object.keys(INTERVALS))for(const key of KEYS)for(const voicing of ['compact','open','rootless'] as const){const p=generate(DEFAULT);const chord=makeChord(key,q as keyof typeof INTERVALS);const c=revoice([{...p.cells[0],chord}],{...DEFAULT,voicing})[0];expect(c.notes.length).toBeGreaterThanOrEqual(3);expect(c.notes.every(n=>INTERVALS[chord.quality].some(v=>(v+chord.rootPc)%12===n%12))).toBe(true);}});
 it('exports the actual performance and exact selected loop boundary',()=>{
 for(const groove of ['held','pocket','swing','bossa','broken'] as const)for(const bass of ['off','roots','walking'] as const){
 const p=generate({...DEFAULT,groove,bass,human:75,roll:80,swing:66}),ns=performance(p),m=new Midi(midiBytes(p,ns,[2,6])),ppq=m.header.ppq;
 expect(m.header.tempos[0].bpm).toBeCloseTo(p.settings.bpm,3);
 expect(m.header.timeSignatures[0].timeSignature).toEqual([4,4]);
 const actual=m.tracks.flatMap(t=>t.notes.map(n=>({track:t.name==='Keys'?'chords':'bass',midi:n.midi,ticks:n.ticks,d:n.durationTicks,velocity:Math.round(n.velocity*127)})));
 const expected=ns.filter(n=>n.beat>=8&&n.beat<24).map(n=>({track:n.track,midi:n.midi,ticks:Math.round((n.beat-8)*ppq),d:Math.max(1,Math.round(Math.min(n.duration,24-n.beat)*ppq)),velocity:Math.floor(n.velocity*127)}));
 const sort=(a:typeof actual[0],b:typeof actual[0])=>a.track.localeCompare(b.track)||a.ticks-b.ticks||a.midi-b.midi;
 expect(actual.sort(sort)).toEqual(expected.sort(sort));
 for(const t of m.tracks)expect(t.endOfTrackTicks).toBe(16*ppq);
 }
 });
 it('keeps all note events inside the form even at extreme timing settings',()=>{
 for(const bars of [4,8,16,32] as const)for(const bpm of [40,300]){const p=generate({...DEFAULT,bars,bpm,roll:100,human:100,swing:75,bass:'walking'}),ns=performance(p);expect(ns).toEqual(performance(p));for(const n of ns){expect(n.beat).toBeGreaterThanOrEqual(0);expect(n.duration).toBeGreaterThan(0);expect(n.beat+n.duration).toBeLessThanOrEqual(bars*4);}}
 });
 it('rejects malformed imported sessions before they reach audio',()=>{const p=generate(DEFAULT);p.cells[0].notes=[NaN];expect(()=>validateProject(p)).toThrow();const q=generate(DEFAULT);q.cells[0].beats=3;expect(()=>validateProject(q)).toThrow();});
});
