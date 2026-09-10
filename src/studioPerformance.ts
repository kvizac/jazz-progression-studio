import { handVoicings } from './leftHand';
import type { Note, Project } from './studio';
import { random, INTERVALS, barCount } from './studio';
import { EXPRESSION } from './performanceSettings';

// Original two-bar motifs. Positions are measured from the BAR, so splitting
// a chord does not restart the groove. Optional notes develop each four-bar phrase.
const keys:Record<string,number[][]>={
 held:[[0],[0]],pocket:[[0,1.5,3.5],[.5,2,3.5]],swing:[[0,1.5,3],[.5,2.5]],
 bossa:[[0,1.5,3],[1,2.5]],funk:[[0,.75,1.5,2.75,3.5],[.5,1.75,2.5,3.75]],
 gospel:[[0,1.5,2],[.5,2,3.5]],disco:[[.5,1.5,2.5,3.5],[.5,1.5,2.5,3.5]],
 latin:[[.5,2,3.5],[1,2.5,3.5]],broken:[[0],[0]],
};
const bassPatterns:Record<string,number[][]>={
 roots:[[0],[0]],walking:[[0,1,2,3],[0,1,2,3]],twofeel:[[0,2],[0,2]],
 soul:[[0,1.5,2,3.5],[0,.75,2,3]],funk:[[0,.75,1.5,2,2.75,3.5],[0,.5,1.75,2.5,3.75]],
 bossa:[[0,1.5,2,3.5],[0,1.5,2,3.5]],disco:[[0,.5,1,1.5,2,2.5,3,3.5],[0,.5,1,1.5,2,2.5,3,3.5]],
 latin:[[1.5,3.5],[.5,1.5,3.5]],
};
const clamp=(n:number,l:number,h:number)=>Math.max(l,Math.min(h,n));
const bassRange=(n:number)=>{while(n>55)n-=12;while(n<28)n+=12;return n;};
export function renderPerformance(p:Project,mode:'performance'|'blocks'='performance'):Note[]{
 const s={...EXPRESSION,...p.settings},out:Note[]=[],end=barCount(s)*4,spb=s.bpm/60,blocks=mode==='blocks';
 const swing=(b:number)=>{const fraction=b-Math.floor(b);return Math.floor(b)+(fraction<.5?fraction*s.swing/50:s.swing/100+(fraction-.5)*(100-s.swing)/50);};
 let previousLeft:number[]=[];
 const phrase=(bar:number,part:number)=>random(s.seed+part+Math.floor(bar/4)*271);
 for(let ci=0;ci<p.cells.length;ci++){
  const c=p.cells[ci],base=c.bar*4+c.beat,stop=base+c.beats,root=36+c.bassPc;
  const hands=blocks?{right:c.notes,left:[]}:handVoicings(c,s,previousLeft);
  previousLeft=hands.left;
  const lr=random(s.seed+31337+ci*191);
  const kr=random(s.seed+919+ci*101),br=random(s.seed+7117+ci*137);
  const add=(midi:number,at:number,duration:number,velocity:number,track:Note['track'],hand?:Note['hand'])=>{
   const beat=clamp(at,base,stop-.012);out.push({midi,beat,duration:clamp(duration,.005,stop-beat),velocity:clamp(velocity,.12,.97),track,...(track==='chords'?{hand:hand??'right'}:{}),cellId:c.id});
  };
  function rhythm(pattern:number[][],density:number,variation:number,part:number,subdivision:number){
   const pr=phrase(c.bar,part),vary=pr()<variation/100;
   let hits=[...pattern[(c.bar+(vary&&c.bar%4===3?1:0))%2]];
   // Sparse settings retain the motif's anchor; extra events stay on a musical grid.
   hits=hits.filter((_,i)=>i===0||random(s.seed+part+i*331+c.bar%2)()<density/65);
   if(density>65)for(let h=0;h<4;h+=subdivision)if(!hits.includes(h)&&random(s.seed+part+Math.round(h*100)+c.bar%2)()<(density-65)/70)hits.push(h);
   if(vary&&c.bar%4===3&&density>30)hits.push(3.25,3.75);
   hits=[...new Set(hits)].sort((a,b)=>a-b).filter(h=>h>=c.beat&&h<c.beat+c.beats).map(h=>h-c.beat);
   // Every harmony has an audible entry, even where a sparse bar motif rests.
   if(!hits.length)hits=[0];return hits;
  }
  let hits=blocks||s.groove==='held'?[0]:rhythm(keys[s.groove],s.density,s.variation,413,.5);
  const arpeggiated=s.groove==='broken'||kr()<s.arp/100;
  if(!blocks&&arpeggiated)hits=Array.from({length:Math.ceil(c.beats*s.arpRate)},(_,i)=>i/s.arpRate).filter((_,i)=>i===0||random(s.seed+ci*101+i)()<s.density/100);
  const pool=[...hands.right].sort((a,b)=>a-b);
  if(s.arpOctaves===2)pool.push(...hands.right.map(n=>n+12).filter(n=>n<=108));
  const ordered=[...new Set(pool)].sort((a,b)=>a-b);
  const arpPool=s.arpPattern==='down'?[...ordered].reverse():s.arpPattern==='pendulum'?[...ordered,...ordered.slice(1,-1).reverse()]:s.arpPattern==='outside'?ordered.map((_,i)=>i%2===0?ordered[i/2]:ordered[ordered.length-1-Math.floor(i/2)]):ordered;
  const warped=hits.map((h,hi)=>{
   let position=base+h;
   if(!blocks&&!arpeggiated&&s.groove!=='held')position=base+(random(s.seed+ci*71+hi*53)()<s.syncopation/100?h:Math.round(h));
   if(!blocks&&s.groove!=='bossa'&&s.groove!=='latin')position=swing(position);
   return clamp(position,base,stop-.025);
  });
  hits.forEach((_,hi)=>{
   const at=warped[hi],next=warped[hi+1]??stop;
   const duration=blocks?c.beats*.96:Math.max(.04,next-at)*(.15+s.gate/100*.83);
   const pitches=blocks||!arpeggiated? [...hands.right].sort((a,b)=>a-b):[arpPool[hi%arpPool.length]];
   if(!blocks&&(s.rollDirection==='down'||s.rollDirection==='alternate'&&hi%2===1))pitches.reverse();
   const delay=blocks?0:(s.pocket+(kr()-.5)*s.human*.5)*.001*spb;
   const accent=(Math.floor(at)%4===0?.12:Math.floor(at)%2===0?.04:-.04)+(c.bar%4===3?-.03:.02);
   pitches.forEach((midi,ni)=>{
    const spread=blocks?0:ni/Math.max(1,pitches.length-1)*s.roll*.001*spb;
    const velocity=blocks?.75:.69+(accent+(midi===Math.max(...hands.right)?.12:-.03)+(kr()-.5)*.15)*s.dynamics/100;
    add(midi,at+delay+spread,duration-spread,velocity,'chords');
   });
  });
  if(!blocks&&hands.left.length&&s.leftLevel>0){
   let lh=[0];
   // A steady support gesture, with optional half-bar answers; never copy the
   // full right-hand rhythm or compete with the bass player's walking pulse.
   for(const beat of [1.5,2,3.5])if(beat>c.beat&&beat<c.beat+c.beats&&lr()<s.leftDensity/100*(beat===2?.9:.3))lh.push(beat-c.beat);
   if(s.groove==='held')lh=[0];
   lh.forEach((h,i)=>{
    const at=(s.groove==='bossa'||s.groove==='latin'?base+h:swing(base+h))+(s.pocket+(lr()-.5)*s.human*.3)*.001*spb;
    const limit=lh[i+1]===undefined?stop:base+lh[i+1];
    const pitches=s.leftHand==='broken'?[hands.left[i%hands.left.length]]:hands.left;
    pitches.forEach((midi,ni)=>add(midi,at+ni*.006*spb,(limit-at)*(.25+s.leftGate*.0073),(.48+(i===0?.04:-.04)+(lr()-.5)*.05)*s.leftLevel/65,'chords','left'));
   });
  }
  if(s.bass==='off')continue;
  let bh=blocks||s.bass==='roots'?[0]:rhythm(bassPatterns[s.bass],s.bassDensity,s.bassVariation,911,s.bass==='funk'?.25:.5);
  if(!bh.includes(0)&&s.bass!=='latin')bh.unshift(0);
  const next=p.cells[(ci+1)%p.cells.length],tones=INTERVALS[c.chord.quality];
  const candidates=[...new Set(tones.map(i=>(i+c.chord.rootPc)%12))].flatMap(pc=>[pc+24,pc+36,pc+48]).filter(n=>n>=28&&n<=55);
  let previous=root;
  bh.forEach((h,i)=>{
   let midi=root;
   if(!blocks&&i>0){
    if(s.bass==='walking'){
     // Connect chord tones with small steps; the last beat can approach the next root.
     const target=root+(i%2?4:7),near=[...candidates].sort((a,b)=>(Math.abs(a-previous)+Math.abs(a-target)*.45+(a===previous?5:0))-(Math.abs(b-previous)+Math.abs(b-target)*.45+(b===previous?5:0)));
     midi=near[0];
    }else if(s.bass==='bossa'||s.bass==='twofeel')midi=h>=2-c.beat?bassRange(root+7):root;
    else if(s.bass==='disco')midi=h%1?root+12:root;
    else if(br()<s.bassVariation/100){const close=candidates.filter(n=>Math.abs(n-previous)<=7);midi=close[Math.floor(br()*close.length)]??root;}
    if(s.bass!=='walking'&&s.bass!=='disco'&&br()<s.bassOctaves/100)midi=root+12;
    if(s.bass==='disco'&&h%1&&br()>s.bassOctaves/100)midi=root;
    if(i===bh.length-1&&h>=c.beats-1&&br()<s.bassApproach/100){
     const target=[next.bassPc+24,next.bassPc+36,next.bassPc+48].sort((a,b)=>Math.abs(a-midi)-Math.abs(b-midi))[0];midi=target+(target>=midi?-1:1);
    }
   }
   midi=bassRange(midi);previous=midi;
   const at=blocks?base+h:(s.bass==='bossa'||s.bass==='latin'?base+h:swing(base+h));
   const nextAt=bh[i+1]===undefined?stop:(s.bass==='bossa'||s.bass==='latin'?base+bh[i+1]:swing(base+bh[i+1]));
   const delay=blocks?0:(s.bassPocket+(br()-.5)*s.human*.25)*.001*spb;
   add(midi,at+delay,blocks?c.beats*.93:(nextAt-at)*(.2+s.bassGate*.0078),blocks?.72:.72+((i===0?.14:-.03)+(br()-.5)*.15)*s.bassDynamics/100,'bass');
  });
 }
 // Prevent a later note-off cutting off a repeated key; bass remains monophonic.
 out.sort((a,b)=>a.beat-b.beat||a.midi-b.midi);
 const last=new Map<string,Note>();
 for(const n of out){const id=n.track==='bass'?'bass':`key:${n.midi}`,prev=last.get(id);if(prev)prev.duration=Math.min(prev.duration,Math.max(0,n.beat-prev.beat-.002));last.set(id,n);}
 return out.filter(n=>n.beat<end&&n.duration>.001);
}
