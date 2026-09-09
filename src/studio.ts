import { parseRomanToken, PC, qualitySuffix, spellPc } from './theory';
import type { ParsedChord, ChordQuality, KeyName, HarmonyStyle } from './types';

export type Settings = { key:KeyName; mode:'major'|'minor'; style:HarmonyStyle; form:'loop'|'aaba'|'blues'|'rhythm'; bars:4|8|16|32; bpm:number; color:number; detail:'triads'|'sevenths'|'extended'; groove:'held'|'pocket'|'swing'|'bossa'|'broken'; swing:number; human:number; roll:number; bass:'off'|'roots'|'walking'; voicing:'compact'|'open'|'rootless'; sound:'piano'|'electric'|'guitar'|'bass'; loop:boolean; click:boolean; countIn:boolean; seed:number; };
export type Cell = { id:string; bar:number; beat:number; beats:number; chord:ParsedChord; bassPc:number; notes:number[]; locked:boolean; section:string; };
export type Project = { version:6; settings:Settings; cells:Cell[]; route:string; };
export type Note = { midi:number; beat:number; duration:number; velocity:number; track:'chords'|'bass'; cellId:string; };
export const DEFAULT:Settings={key:'F',mode:'major',style:'neosoul',form:'loop',bars:8,bpm:82,color:45,detail:'extended',groove:'pocket',swing:56,human:18,roll:12,bass:'roots',voicing:'open',sound:'piano',loop:true,click:false,countIn:false,seed:62719};
export const KEYS:KeyName[]=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
export const STYLES:Record<HarmonyStyle,string>={classic:'Jazz',bebop:'Bebop',modern:'Modern jazz',neosoul:'Neo-soul',rnb:'R&B / Soul'};
export const INTERVALS:Record<ChordQuality,number[]>={maj:[0,4,7],min:[0,3,7],domTriad:[0,4,7],halfDimTriad:[0,3,6],dimTriad:[0,3,6],maj7:[0,4,7,11],maj6:[0,4,7,9],maj9:[0,4,7,11,14],'maj9#11':[0,4,11,14,18],maj69:[0,4,7,9,14],min7:[0,3,7,10],min9:[0,3,7,10,14],minMaj7:[0,3,7,11],min69:[0,3,7,9,14],dom7:[0,4,7,10],dom9:[0,4,7,10,14],dom13:[0,4,10,14,21],dom7b9:[0,4,7,10,13],'dom7#9':[0,4,7,10,15],'dom7#11':[0,4,10,14,18],dom7alt:[0,4,8,10,13],dom7sus:[0,5,7,10,14],halfDim7:[0,3,6,10],dim7:[0,3,6,9]};
export const QUALITY_LABELS:Record<ChordQuality,string>={...Object.fromEntries(Object.keys(INTERVALS).map(q=>[q,qualitySuffix(q as ChordQuality)])),maj:'Major',min:'Minor',domTriad:'Major',halfDimTriad:'Diminished',dimTriad:'Diminished'} as Record<ChordQuality,string>;
export function random(seed:number){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function freshSeed(){return crypto.getRandomValues(new Uint32Array(1))[0];}
const pick=<T,>(a:T[],r:()=>number)=>a[Math.floor(r()*a.length)];
type Family={name:string; a:string[]; response:string[]; bridge:string[];};
// Original phrase recipes: tonal prolongation -> predominant -> dominant -> arrival.
// Paired answers preserve the motif; structural repetition is intentional.
const JAZZ:Family[]=[
{name:'Relative-minor journey',a:['IΔ9','iiø7/vi,V7b9/vi','vi9','V7/ii'],response:['ii9','V13','I6/9','ii9,V13'],bridge:['ii7/IV','V7/IV','IVΔ9','iv9,bVII13']},
{name:'Subdominant conversation',a:['I6/9','I7','IVΔ9','#iv°7'],response:['iii7,VI7','ii9,V13','IΔ9','ii9,V13'],bridge:['iiø7/vi','V7b9/vi','vi9','V7/ii']},
{name:'Circle in two shades',a:['ii9','V13','IΔ9','IVΔ9'],response:['iiø7/vi','V7b9/vi','vi9','ii9,V13'],bridge:['ii7/IV,V7/IV','IVΔ9','iv9','bVII13']},
{name:'Descending turnaround',a:['IΔ9','VII7','bVII13','VI7b9'],response:['ii9','V13','iii7,VI7','ii9,V13'],bridge:['IVΔ9','#iv°7','I6/9','VI7']},
];
const SOUL:Family[]=[
{name:'Subdominant afterglow',a:['IVΔ9','iii7,VI7b9','ii9','V7sus'],response:['IΔ9','I7','IVΔ9','iv9,bVII13'],bridge:['vi9','V7/ii','ii9','V13']},
{name:'Minor-side pocket',a:['vi9','ii9','V7sus','IΔ9'],response:['IVΔ9','iii7,VI7b9','ii9','V7sus'],bridge:['bIIIΔ9','iv9','IΔ9','V7/vi']},
{name:'Borrowed evening',a:['IΔ9','iii7','IVΔ9','iv9'],response:['I6/9','V7/vi','vi9','iv9,bVII13'],bridge:['ii9','V13','iii7','VI7b9']},
{name:'Gospel return',a:['I6/9','iii7,VI7','ii9','V13'],response:['IVΔ9','#iv°7','I6/9','ii9,V13'],bridge:['vi9','V7/ii','ii9','iv9,bVII13']},
{name:'Backdoor bloom',a:['IΔ9','vi9','iv9','bVII13'],response:['iii7','VI7b9','ii9','V7sus'],bridge:['IVΔ9','iv9','IΔ9','V7/vi']},
];
const MODERN:Family[]=[
{name:'Lydian horizons',a:['IΔ9#11','V7sus','bIIIΔ9#11','ii9,V13'],response:['IΔ9','ii7/IV,V7/IV','IVΔ9#11','iv9,bVII13'],bridge:['ii7/bIII,V7/bIII','bIIIΔ9','ii7/II,V7/II','II7']},
{name:'Suspended conversation',a:['ii9','V7sus','IΔ9#11','bVII13'],response:['IVΔ9#11','iv9','IΔ9','V7sus'],bridge:['vi9','ii7/IV,V7/IV','IVΔ9','V7alt']},
{name:'Third-related light',a:['IΔ9','ii7/bIII,V7/bIII','bIIIΔ9','V7/ii'],response:['ii9','V7alt','IΔ9#11','V7sus'],bridge:['ii7/III,V7/III','IIIΔ9','ii7/VI,V7/VI','VI7']},
];
// Minor recipes use natural-minor Roman degrees; V remains major/altered.
const MINOR:Family[]=[
{name:'Minor midnight',a:['i9','VIΔ9','iiø7','V7b9'],response:['i9','iv9','VII13','IIIΔ9'],bridge:['VIΔ9','iv9','iiø7','V7alt']},
{name:'Minor circle',a:['iv9','VII13','IIIΔ9','VIΔ9'],response:['iiø7','V7b9','i9','V7alt'],bridge:['iv9','ii7/III,V7/III','IIIΔ9','V7b9']},
{name:'Minor gospel',a:['i9','v7','VIΔ9','V7sus,V7b9'],response:['iv9','VII13','IIIΔ9','V7b9'],bridge:['VIΔ9','iv9','iiø7','V7alt']},
{name:'Minor line',a:['i9','i-Δ','i-6/9','V7b9'],response:['iv9','iiø7','V7b9','i9'],bridge:['IIIΔ9','VIΔ9','iiø7','V7alt']},
];
export function barCount(s:Settings){return s.form==='blues'?12:(s.form==='aaba'||s.form==='rhythm')?32:s.bars;}
function recipes(s:Settings){return s.mode==='minor'?MINOR:s.style==='modern'?MODERN:(s.style==='neosoul'||s.style==='rnb')?SOUL:JAZZ;}
function tokens(s:Settings):{bars:string[];sections:string[];name:string}{
 const r=random(s.seed), f=pick(recipes(s),r), n=barCount(s), tonic=s.mode==='minor'?'i9':'I6/9';
 let a=[...f.a], response=[...f.response], bridge=[...f.bridge];
 if(s.form==='blues')return {name:'Jazz blues · call, response, turnaround',sections:Array.from({length:12},(_,i)=>i<4?'A':i<8?'B':'C'),bars:s.mode==='minor'?['i9','iv9','i9','i9','iv9','iv9','i9','VI7','iiø7','V7b9','i9,VI7','iiø7,V7b9']:['I13','IV9','I13','ii7/IV,V7/IV','IV9','#iv°7','I6/9','VI7b9','ii9','V13','iii7,VI7','ii9,V13']};
 if(s.form==='rhythm') {a=['I6/9,VI7','ii9,V13','iii7,VI7','ii9,V13'];response=['I7','IVΔ9,#iv°7','I6/9,VI7','ii9,V13'];bridge=['III7','III7','VI7','VI7'];const bars=[...a,...response,...a,...response,...bridge,'II7','II7','V13','V13',...a,...response];return {name:'Rhythm changes · AABA',sections:bars.map((_,i)=>i<8?'A1':i<16?'A2':i<24?'B':'A3'),bars};}
 let bars:string[], sections:string[];
 if(s.form==='aaba') {const answer=[...response];answer[3]=tonic;bars=[...a,...response,...a,...answer,...bridge,...f.bridge.slice(0,2),s.mode==='minor'?'iiø7':'ii9',s.mode==='minor'?'V7b9':'V13',...a,...answer];sections=bars.map((_,i)=>i<8?'A1':i<16?'A2':i<24?'B':'A3');}
 else if(n===4){bars=a;sections=bars.map(()=>'A');}
 else if(n===8){bars=[...a,...response];sections=bars.map((_,i)=>i<4?'A':'A′');}
 else if(n===16){bars=[...a,...response,...bridge,...response];sections=bars.map((_,i)=>i<4?'A':i<8?'A′':i<12?'B':'A″');}
 else {bars=[...a,...response,...bridge,...response,...a,...response,...bridge,...response];sections=bars.map((_,i)=>['A','B','A′','C'][Math.floor(i/8)]);bars[31]=tonic;}
 // Context-dependent reharmonization: dominants only, preserving their destinations.
 bars=bars.map((b,i)=>b.split(',').map(t=>{
  if(s.color>65&&r()<.25&&/^V(13|7)$/.test(t))return s.mode==='minor'?'V7alt':'subV/I';
  if(s.color>35&&r()<.35&&/^V7\/(vi|ii)$/.test(t))return t.replace('V7/','V7b9/');
  if(s.style==='bebop'&&i%4===2&&t==='I6/9')return 'iii7,VI7b9';
  if(s.color<25)return t.replace('Δ9#11','Δ9').replace('7alt','7').replace('7b9','7');
  return t;
 }).join(','));
 return {bars,sections,name:f.name};
}
function candidates(chord:ParsedChord,style:Settings['voicing']):number[][]{
 let ints=INTERVALS[chord.quality];if(style==='rootless'&&ints.length>3)ints=ints.filter(i=>i!==0);
 const pcs=[...new Set(ints.map(i=>(i+chord.rootPc)%12))].sort((a,b)=>a-b), out:number[][]=[];
 for(let rotation=0;rotation<pcs.length;rotation++)for(let octave=3;octave<=5;octave++){
  let notes=Array.from({length:pcs.length},(_,i)=>pcs[(i+rotation)%pcs.length]+12*(octave+(i+rotation>=pcs.length?1:0)));
  if(style==='open'&&notes.length>=4){notes[notes.length-2]-=12;notes.sort((a,b)=>a-b);}
  if(notes[0]>=48&&notes.at(-1)!<=84&&notes.at(-1)!-notes[0]<=28)out.push(notes);
 }
 return out;
}
function cost(a:number[],b:number[]){let n=Math.min(a.length,b.length),c=Math.abs(a.at(-1)!-b.at(-1)!)*1.3;for(let i=0;i<n;i++)c+=Math.abs(a[i]-b[i]);return c+Math.abs(a.length-b.length)*3;}
export function revoice(cells:Cell[],s:Settings):Cell[]{
 if(!cells.length)return [];
 const options=cells.map(c=>c.locked?[c.notes]:candidates(c.chord,s.voicing));
 // Dynamic programming, with an explicit loop-seam penalty and stable register.
 let best:number[][]=[], bestCost=Infinity;
 for(const first of options[0]){
 let costs=options[0].map(v=>v===first?Math.abs(v.reduce((a,b)=>a+b,0)/v.length-64):Infinity), parents:number[][]=[];
 for(let i=1;i<options.length;i++){
  const next=options[i].map(v=>{let bi=0,bc=Infinity;options[i-1].forEach((p,j)=>{const c=costs[j]+cost(p,v)+Math.abs(v.reduce((a,b)=>a+b,0)/v.length-65)*.12;if(c<bc){bc=c;bi=j;}});return {bc,bi};});parents[i]=next.map(v=>v.bi);costs=next.map(v=>v.bc);
 }
 costs.forEach((c,j)=>{const total=c+cost(options.at(-1)![j],first)*.7;if(total<bestCost){bestCost=total;let k=j;const path:number[][]=[];for(let i=options.length-1;i>=0;i--){path[i]=options[i][k];k=parents[i]?.[k]??0;}best=path;}});
 }
 return cells.map((c,i)=>({...c,notes:best[i]}));
}
function spellFunction(chord:ParsedChord,token:string,key:KeyName):ParsedChord{
 const letters=['C','D','E','F','G','A','B'],degrees=['I','II','III','IV','V','VI','VII'];
 const part=token.split('/'),plain=part[0].match(/^(?:bb|##|b|#)?([ivIV]+)/),target=part.length>1&&/^[b#]*[ivIV]+$/.test(part[1])?part[1]:null;
 let offset=plain?degrees.indexOf(plain[1].toUpperCase()):0;
 if(target){const targetDegree=target.replace(/^[b#]+/,'').toUpperCase();offset=degrees.indexOf(targetDegree)+(token.startsWith('subV')?1:offset);}
 if(offset<0)return chord;
 const letter=letters[(letters.indexOf(key[0])+offset)%7],natural=PC[letter];let acc=(chord.rootPc-natural+12)%12;if(acc>6)acc-=12;
 const rootName=letter+(acc>0?'#'.repeat(acc):'b'.repeat(-acc));return {...chord,rootName,symbol:rootName+qualitySuffix(chord.quality)};
}
export function generate(s:Settings,previous:Cell[]=[]):Project{
 const plan=tokens(s);let cells:Cell[]=[];
 plan.bars.forEach((b,bar)=>{const ts=b.split(',');ts.forEach((t,j)=>{const beat=j*4/ts.length;const old=previous.find(c=>c.bar===bar&&c.beat===beat&&c.beats===4/ts.length&&c.locked);const chord=spellFunction(parseRomanToken(t,s.key,s.mode,s.detail),t,s.key);cells.push(old?{...old,section:plan.sections[bar]}:{id:`${bar}:${beat}`,bar,beat,beats:4/ts.length,chord,bassPc:chord.rootPc,notes:[],locked:false,section:plan.sections[bar]});});});
 // A locked bar keeps its rhythm as well as its chord/voicing.
 for(let bar=0;bar<plan.bars.length;bar++){if(previous.some(c=>c.bar===bar&&c.locked)){cells=cells.filter(c=>c.bar!==bar);cells.push(...previous.filter(c=>c.bar===bar));}}
 cells.sort((a,b)=>a.bar-b.bar||a.beat-b.beat);
 return {version:6,settings:s,cells:revoice(cells,s),route:plan.name};
}
export function transpose(p:Project,key:KeyName):Project{
 let delta=(PC[key]-PC[p.settings.key]+12)%12;if(delta>6)delta-=12;
 return {...p,settings:{...p.settings,key},cells:p.cells.map(c=>{const rootPc=(c.chord.rootPc+delta+12)%12, rootName=spellPc(rootPc,key);return {...c,bassPc:(c.bassPc+delta+12)%12,notes:c.notes.map(n=>n+delta),chord:{...c.chord,rootPc,rootName,symbol:rootName+qualitySuffix(c.chord.quality)}};})};
}
export function makeChord(root:string,q:ChordQuality):ParsedChord{const match=root.match(/^([A-G])([b#]*)$/);if(!match)throw Error('Unknown root');const rootPc=(PC[match[1]]+[...match[2]].reduce((n,a)=>n+(a==='#'?1:-1),0)+24)%12;return {rootPc,rootName:root,quality:q,symbol:root+qualitySuffix(q),roman:'Custom',token:root+qualitySuffix(q)};}
export function noteName(n:number){return `${['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'][((n%12)+12)%12]}${Math.floor(n/12)-1}`;}
export function chordLabel(c:Cell,s:Settings){return c.chord.symbol+(c.bassPc!==c.chord.rootPc?'/'+spellPc(c.bassPc,s.key):'');}
export function performance(p:Project,mode:'performance'|'blocks'='performance'):Note[]{
 const s=p.settings, r=random(s.seed+919),out:Note[]=[],end=barCount(s)*4, secToBeat=s.bpm/60;
 const swing=(b:number)=>Math.floor(b)+(b%1<.5?b%1*(s.swing/50):(s.swing/100)+(b%1-.5)*((100-s.swing)/50));
 for(let ci=0;ci<p.cells.length;ci++){
 const c=p.cells[ci],base=c.bar*4+c.beat,stop=base+c.beats;
 let hits:number[]=[0];
 if(mode!=='blocks'){
  if(s.groove==='pocket')hits=c.bar%2===0?[0,1.5,3.5]:[.5,2,3.5];
  if(s.groove==='swing')hits=c.bar%2===0?[0,1.5,3]:[.5,2.5];
  if(s.groove==='bossa')hits=c.bar%2===0?[0,1.5,3]:[0,1,2.5];
  if(s.groove==='broken')hits=Array.from({length:Math.ceil(c.beats*2)},(_,i)=>i*.5);
 }
 hits=hits.filter(b=>b<c.beats);if(!hits.length)hits=[0];
 hits.forEach((h,hi)=>{
  let at=base+h;if(mode!=='blocks'&&(s.groove==='swing'||s.groove==='pocket'||s.groove==='broken'))at=swing(at);
  const next=hi+1<hits.length?base+hits[hi+1]:stop;
  const duration=mode==='blocks'||s.groove==='held'?c.beats*.96:s.groove==='broken'?.46:Math.min(.9,next-(base+h));
  const notes=s.groove==='broken'&&mode!=='blocks'?[c.notes[hi%c.notes.length]]:c.notes;
  const delay=mode==='blocks'?0:((r()-.35)*s.human*.0007)*secToBeat;
  notes.forEach((midi,ni)=>{const beat=Math.max(base,Math.min(stop-.04,at+delay+(mode==='blocks'?0:ni*s.roll*.001*secToBeat/Math.max(1,notes.length-1))));out.push({midi,beat,duration:Math.max(.02,Math.min(duration,stop-beat-.01)),velocity:mode==='blocks'?.75:Math.max(.25,Math.min(.95,.69+(ni===notes.length-1?.06:0)+(r()-.5)*s.human/160-(hi%2?.06:0))),track:'chords',cellId:c.id});});
 });
 if(s.bass!=='off'){
 const root=36+c.bassPc, next=p.cells[(ci+1)%p.cells.length];
 const count=s.bass==='walking'?Math.ceil(c.beats):1;
 for(let i=0;i<count;i++){let midi=root;if(i>0){const tones=INTERVALS[c.chord.quality];midi=i===count-1?36+next.bassPc+(next.bassPc>=c.bassPc?-1:1):root+tones[i%Math.min(3,tones.length)];while(midi>52)midi-=12;while(midi<28)midi+=12;}out.push({midi,beat:base+i,duration:s.bass==='walking'?.86:c.beats*.93,velocity:.72,track:'bass',cellId:c.id});}
 }
 }
 return out.filter(n=>n.beat<end).sort((a,b)=>a.beat-b.beat||a.midi-b.midi);
}
export function validateProject(x:unknown):Project{
 const p=x as Project;if(!p||p.version!==6||!p.settings||!Array.isArray(p.cells))throw Error('Choose a Studio v6 project file.');
 const s=p.settings;
 if(!KEYS.includes(s.key)||!['major','minor'].includes(s.mode)||!Object.keys(STYLES).includes(s.style)||!['loop','aaba','blues','rhythm'].includes(s.form)||![4,8,16,32].includes(s.bars))throw Error('Invalid project settings.');
 const ranges:[number,number,number][]=[[s.bpm,40,300],[s.color,0,100],[s.swing,50,75],[s.human,0,100],[s.roll,0,100],[s.seed,0,4294967295]];
 if(ranges.some(([v,l,h])=>!Number.isFinite(v)||v<l||v>h)||!['compact','open','rootless'].includes(s.voicing)||!['off','roots','walking'].includes(s.bass)||!['piano','electric','guitar','bass'].includes(s.sound)||!['held','pocket','swing','bossa','broken'].includes(s.groove)||!['triads','sevenths','extended'].includes(s.detail)||['loop','click','countIn'].some(k=>typeof s[k as keyof Settings]!=='boolean'))throw Error('Invalid performance settings.');
 if(p.cells.length<4||p.cells.length>128)throw Error('Invalid chord count.');
 const ids=new Set<string>();
 for(let bar=0;bar<barCount(s);bar++){let beat=0;const cells=p.cells.filter(c=>c.bar===bar).sort((a,b)=>a.beat-b.beat);if(!cells.length)throw Error('Missing bar.');for(const c of cells){if(c.beat!==beat||![1,2,3,4].includes(c.beats)||!c.chord||!INTERVALS[c.chord.quality]||!Number.isInteger(c.chord.rootPc)||c.chord.rootPc<0||c.chord.rootPc>11||!Number.isInteger(c.bassPc)||c.bassPc<0||c.bassPc>11||!Array.isArray(c.notes)||c.notes.length<1||c.notes.length>8||c.notes.some(n=>!Number.isInteger(n)||n<24||n>96)||new Set(c.notes).size!==c.notes.length||typeof c.id!=='string'||ids.has(c.id)||typeof c.locked!=='boolean'||typeof c.section!=='string')throw Error('Invalid chord data.');ids.add(c.id);beat+=c.beats;}if(beat!==4)throw Error('Each bar must contain four beats.');}
 if(p.cells.some(c=>!Number.isInteger(c.bar)||c.bar<0||c.bar>=barCount(s)))throw Error('Invalid bar.');
 return {...p,route:typeof p.route==='string'?p.route.slice(0,100):'Imported progression',cells:[...p.cells].map(c=>({...c,section:c.section.slice(0,8),chord:{...c.chord,rootName:spellPc(c.chord.rootPc,s.key),symbol:spellPc(c.chord.rootPc,s.key)+qualitySuffix(c.chord.quality),roman:typeof c.chord.roman==='string'?c.chord.roman.slice(0,20):'Custom'}})).sort((a,b)=>a.bar-b.bar||a.beat-b.beat)};
}
