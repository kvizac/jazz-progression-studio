import { generate,barCount,revoice,makeChord,KEYS,random,freshSeed } from './studio';
import type { Project,Settings,Cell } from './studio';
import { parseRomanToken,spellPc } from './theory';
import type { ParsedChord } from './types';
export const signature=(p:Project)=>p.cells.map(c=>`${c.bar}:${c.beat}:${c.beats}:${c.chord.rootPc}:${c.chord.quality}`).join('|');
export function changeHarmony(p:Project,patch:Partial<Settings>):Project{
 return generate({...p.settings,...patch},p.cells);
}
export function newProgression(p:Project,range:[number,number]=[0,barCount(p.settings)],seed=freshSeed()):{project:Project;changed:number;message:string}{
 const locked=new Set(p.cells.filter(c=>c.locked).map(c=>c.bar));
 const eligible=p.cells.filter(c=>c.bar>=range[0]&&c.bar<range[1]&&!locked.has(c.bar));
 if(!eligible.length)return {project:p,changed:0,message:'Every bar in this range is locked. Unlock a bar to generate new harmony.'};
 const pr=random(seed);let candidate=p;
 for(let i=0;i<48;i++){
  const generated=generate({...p.settings,seed:Math.floor(pr()*4294967296)},p.cells);
  const cells=[...p.cells.filter(c=>c.bar<range[0]||c.bar>=range[1]),...generated.cells.filter(c=>c.bar>=range[0]&&c.bar<range[1])].sort((a,b)=>a.bar-b.bar||a.beat-b.beat);
  candidate={...generated,cells};
  if(signature(candidate)!==signature(p))break;
 }
 if(signature(candidate)===signature(p)){
  // A narrow unlocked range may be invariant in the form grammar. Introduce
  // a local approach to the following harmony instead of reporting a false success.
  const c=eligible[eligible.length-1],index=p.cells.findIndex(v=>v.id===c.id),next=p.cells[(index+1)%p.cells.length];
  const roots=[(next.chord.rootPc+7)%12,(next.chord.rootPc+1)%12];
  const root=roots.find(pc=>pc!==c.chord.rootPc)??roots[0];
  const chord=makeChord(spellPc(root,p.settings.key),p.settings.detail==='triads'?'domTriad':p.settings.detail==='sevenths'?'dom7':'dom9');
  const voiced=revoice([{...c,chord,bassPc:root,locked:false}],p.settings)[0];
  candidate={...p,settings:{...p.settings,seed},cells:p.cells.map(v=>v.id===c.id?voiced:v)};
 }
 const changed=Array.from({length:barCount(p.settings)},(_,bar)=>bar).filter(bar=>JSON.stringify(p.cells.filter(c=>c.bar===bar).map(c=>[c.beat,c.beats,c.chord.rootPc,c.chord.quality]))!==JSON.stringify(candidate.cells.filter(c=>c.bar===bar).map(c=>[c.beat,c.beats,c.chord.rootPc,c.chord.quality]))).length;
 return {project:candidate,changed,message:`New progression · ${changed} ${changed===1?'bar':'bars'} changed${locked.size?` · ${locked.size} locked bars kept`:''}.`};
}
export function chordSuggestions(p:Project,c:Cell):{chord:ParsedChord;reason:string}[]{
 const next=p.cells[(p.cells.findIndex(x=>x.id===c.id)+1)%p.cells.length];
 const dominant=makeChord(KEYS[(next.chord.rootPc+7)%12],p.settings.detail==='triads'?'domTriad':p.settings.detail==='sevenths'?'dom7':'dom9');
 const tokens=p.settings.mode==='minor'?['i9','iv9','iiø7','V7b9','VIΔ9','IIIΔ9']:['IΔ9','ii9','iii7','IVΔ9','V13','vi9'];
 const reasons=p.settings.mode==='minor'?['Home / resolution','Predominant color','Minor-key approach','Dominant tension','Relative color','Relative-major color']:['Home / resolution','Predominant color','Mediant color','Subdominant color','Dominant tension','Relative-minor color'];
 const suggestions=[{chord:dominant,reason:`Dominant → ${next.chord.symbol}`},...tokens.map((token,i)=>({chord:parseRomanToken(token,p.settings.key,p.settings.mode,p.settings.detail),reason:reasons[i]}))];
 const seen=new Set<string>([`${c.chord.rootPc}:${c.chord.quality}`]);
 return suggestions.filter(x=>{const key=`${x.chord.rootPc}:${x.chord.quality}`;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,6);
}
export function applySuggestion(p:Project,c:Cell,chord:ParsedChord):Project{
 return {...p,cells:revoice(p.cells.map(v=>v.id===c.id?{...v,chord,bassPc:chord.rootPc,locked:false}:v),p.settings)};
}
export function swapChords(p:Project,from:string,to:string):Project{
 const a=p.cells.find(c=>c.id===from),b=p.cells.find(c=>c.id===to);
 if(!a||!b||a===b||a.locked||b.locked)return p;
 return {...p,cells:p.cells.map(c=>c.id===from?{...c,chord:b.chord,bassPc:b.bassPc,notes:[...b.notes]}:c.id===to?{...c,chord:a.chord,bassPc:a.bassPc,notes:[...a.notes]}:c)};
}
