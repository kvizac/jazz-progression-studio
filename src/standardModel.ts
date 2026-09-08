import type { Params, PhraseTrace, TonalCenterPlan } from './types';
import type { ChorusPlan } from './harmonyModel';

export const STANDARD_FORM_LENGTH=32;

type Tag='cycle'|'tonicization'|'minor'|'diminished'|'backdoor'|'chromatic'|'tritone';
type Phrase={id:string;family:string;bars:string[];centers:string[];target:string;weight:number;minColor?:number;maxColor?:number;classic?:number;bebop?:number;tags?:Tag[]};
type AFamily={
  id:string;
  family:string;
  first:string[];
  second:string[];
  final:string[];
  centers:string[];
  weight:number;
  minColor?:number;
  classic?:number;
  bebop?:number;
  tags?:Tag[];
};
type SectionResult={bars:string[];centers:string[];phrases:Phrase[]};

/**
 * Complete 8-bar A-section grammars. Each family has a first ending, second ending and
 * final ending. This prevents two individually valid 4-bar fragments from being joined
 * at a harmonically nonsensical boundary.
 */
const A_FAMILIES:AFamily[]=[
  {
    id:'a-songbook-cycle',family:'songbook diminished cycle',weight:34,centers:['I','#i°','ii','V','iii','VI','ii','V'],tags:['diminished','cycle'],
    first:['IΔ9','#i°7','ii9','V13','iii7','VI7','ii9','V13'],
    second:['IΔ9','#i°7','ii9','V13','iii7','VI7','ii9,V13','I6/9,V7'],
    final:['IΔ9','#i°7','ii9','V13','iii7,VI7','ii9,V13','IΔ9','I6/9'],
  },
  {
    id:'a-relative-minor',family:'relative-minor route',weight:31,minColor:16,centers:['I','vi','ii','V','I','VI','ii','V'],tags:['minor','tonicization','cycle'],
    first:['IΔ9','V7/vi','vi9','V7/ii','ii9','V13','I6/9,VI7','ii9,V13'],
    second:['IΔ9','V7/vi','vi9','V7/ii','ii9','V13','IΔ9','V7'],
    final:['IΔ9','V7/vi','vi9','V7/ii','ii9','V13','IΔ9','I6/9'],
  },
  {
    id:'a-major-minor-cycle',family:'major/minor cycle',weight:29,minColor:18,centers:['ii','V','I','IV','vi','V/vi','iii','VI','ii','V'],tags:['cycle','minor','tonicization'],classic:1.12,
    first:['ii9','V13','IΔ9','IVΔ9','iiø7/vi','V7b9/vi','vi9,V7/ii','ii9,V13'],
    second:['ii9','V13','IΔ9','IVΔ9','iii7','VI7','ii9,V13','I6/9,V7'],
    final:['ii9','V13','IΔ9','IVΔ9','iii7','VI7','ii9,V13','I6/9'],
  },
  {
    id:'a-subdominant-backdoor',family:'subdominant / backdoor route',weight:27,minColor:24,centers:['I','IV','iv','bVII','iii','VI','ii','V','I'],tags:['tonicization','backdoor','cycle'],classic:1.15,
    first:['IΔ9','I7','IVΔ9','iv7','iii7','VI7','ii9','V13'],
    second:['IΔ9','I7','IVΔ9','iv7,bVII7','iii7','VI7','ii9,V13','I6/9,V7'],
    final:['IΔ9','I7','IVΔ9','iv7,bVII7','iii7,VI7','ii9,V13','IΔ9','I6/9'],
  },
  {
    id:'a-biii-side',family:'chromatic bIII side-step',weight:12,minColor:62,centers:['I','bIII','ii','V','I','VI','ii','V'],tags:['chromatic','tonicization','cycle'],bebop:1.25,
    first:['IΔ9','ii7/bIII,V7/bIII','bIIIΔ9','V7/ii','ii9','V13','I6/9,VI7','ii9,V13'],
    second:['IΔ9','ii7/bIII,V7/bIII','bIIIΔ9','V7/ii','ii9','V13','IΔ9','V7'],
    final:['IΔ9','ii7/bIII,V7/bIII','bIIIΔ9','V7/ii','ii9','V13','IΔ9','I6/9'],
  },
];

const BRIDGES:Phrase[]=[
  {id:'b-dominant-cycle',family:'dominant-cycle bridge',target:'V',weight:26,maxColor:66,bars:['III7','VI7','II7','V7','iii7','VI7','ii9','V13'],centers:['III','VI','II','V','iii','VI','ii','V'],tags:['cycle'],bebop:1.25},
  {id:'b-third-centers',family:'third-related major-center bridge',target:'V',weight:31,minColor:28,bars:['IVΔ9','ii7/bII,V7/bII','bIIΔ9','ii7/VI,V7/VI','VIΔ9','ii7/bII,V7/bII','bIIΔ9','ii9,V7alt'],centers:['IV','bII','VI','bII','ii','V'],tags:['tonicization','chromatic','cycle'],classic:1.2},
  {id:'b-sequential-centers',family:'sequential ii–V center bridge',target:'V',weight:30,minColor:24,bars:['ii7/III,V7/III','IIIΔ9','ii7/VI,V7/VI','VIΔ9','ii7/II,V7/II','II7','ii7/V,V7/V','V7'],centers:['III','VI','II','V'],tags:['tonicization','cycle']},
  {id:'b-minor-major',family:'minor-to-major center bridge',target:'V',weight:27,minColor:34,bars:['iiø7/vi','V7b9/vi','vi9','ii7/bIII,V7/bIII','bIIIΔ9','ii7/IV,V7/IV','IVΔ9','ii9,V7alt'],centers:['vi','bIII','IV','ii','V'],tags:['minor','tonicization','chromatic']},
  {id:'b-subdominant',family:'subdominant / backdoor bridge',target:'V',weight:22,minColor:18,bars:['ii7/IV','V7/IV','IVΔ9','iv7','bVII7','iii7,VI7','ii9','V7alt'],centers:['IV','iv','bVII','iii','VI','ii','V'],tags:['tonicization','backdoor','cycle'],classic:1.25},
  {id:'b-tritone',family:'tritone dominant bridge',target:'V',weight:3,minColor:88,bars:['III7','subV/VI','VI7','subV/II','II7','subV/V','ii9','V7alt'],centers:['III','subV/VI','VI','subV/II','II','subV/V','ii','V'],tags:['tritone','chromatic'],bebop:1.35},
];

const C_SECTIONS:Phrase[]=[
  {id:'c-subdominant',family:'subdominant closing section',target:'I',weight:37,bars:['ii7/IV','V7/IV','IVΔ9','iv7,bVII7','iii7','VI7','ii9,V13','I6/9'],centers:['IV','iv','bVII','iii','VI','ii','V','I'],tags:['tonicization','backdoor','cycle']},
  {id:'c-relative-minor',family:'relative-minor closing section',target:'I',weight:30,minColor:24,bars:['iiø7/vi','V7b9/vi','vi9','V7/ii','ii9','V13','IΔ9','I6/9'],centers:['vi','ii','V','I'],tags:['minor','tonicization','cycle']},
  {id:'c-major-centers',family:'chromatic major-center closing section',target:'I',weight:17,minColor:52,bars:['ii7/bIII,V7/bIII','bIIIΔ9','ii7/III,V7/III','IIIΔ9','ii7/VI,V7/VI','VI7','ii9,V7alt','I6/9'],centers:['bIII','III','VI','ii','V','I'],tags:['chromatic','tonicization','cycle'],bebop:1.2},
  {id:'c-songbook',family:'songbook turnaround close',target:'I',weight:28,bars:['IVΔ9','#iv°7','I6/9','VI7','ii9','V13','IΔ9','I6/9'],centers:['IV','#iv°','I','VI','ii','V','I'],tags:['diminished','cycle'],classic:1.15},
];

function hashSeed(seed:number,salt:number):number{let x=(seed^Math.imul(salt+1,0x9e3779b9))>>>0;x^=x<<13;x>>>=0;x^=x>>>17;x>>>=0;x^=x<<5;x>>>=0;return x>>>0;}
function unit(seed:number,salt:number):number{return hashSeed(seed,salt)/0xffffffff;}
function tagMultiplier(tags:Tag[]|undefined,color:number):number{const t=new Set(tags??[]);let m=1;if(t.has('cycle'))m*=1.15;if(t.has('tonicization'))m*=0.88+color/170;if(t.has('minor'))m*=0.85+color/190;if(t.has('diminished'))m*=0.75+color/210;if(t.has('backdoor'))m*=0.70+color/170;if(t.has('chromatic'))m*=0.45+color/110;if(t.has('tritone'))m*=0.10+color/120;return m;}
function weightedPick<T extends {weight:number;minColor?:number;maxColor?:number;classic?:number;bebop?:number;tags?:Tag[]}>(pool:T[],params:Params,salt:number,blockedIds=new Set<string>()):T{
  const candidates=pool.filter(p=>(p.minColor===undefined||params.color>=p.minColor)&&(p.maxColor===undefined||params.color<=p.maxColor)&&!blockedIds.has((p as T&{id:string}).id));
  if(!candidates.length)throw new Error('No standard-form phrase candidates fit this harmonic distance.');
  const weighted=candidates.map(p=>({p,w:p.weight*(params.preset==='bebop'?(p.bebop??1):(p.classic??1))*tagMultiplier(p.tags,params.color)}));
  const total=weighted.reduce((s,x)=>s+x.w,0);let cursor=unit(params.seed,salt)*total;
  for(const x of weighted){cursor-=x.w;if(cursor<=0)return x.p;}return weighted[weighted.length-1].p;
}
function asASection(family:AFamily,ending:'first'|'second'|'final'):SectionResult{
  const bars=ending==='first'?family.first:ending==='second'?family.second:family.final;
  const phrase:Phrase={id:`${family.id}-${ending}`,family:family.family,bars:[...bars],centers:[...family.centers],target:ending==='final'?'I':'V',weight:family.weight,tags:family.tags};
  return{bars:[...bars],centers:[...family.centers],phrases:[phrase]};
}
function addMetadata(chorus:number,section:string,base:number,result:SectionResult,intent:string,centers:TonalCenterPlan[],phrases:PhraseTrace[]):void{
  centers.push({chorus,section,centers:result.centers,mode:'major',intent});let cursor=base;
  for(const p of result.phrases){phrases.push({chorus,section,startBar:cursor,endBar:cursor+p.bars.length-1,family:p.family,target:p.target,templateId:p.id});cursor+=p.bars.length;}
}
function formForSeed(params:Params):'AABA'|'ABAC'{return unit(params.seed,11)<(params.preset==='classic'?0.64:0.56)?'AABA':'ABAC';}

export function buildStandardChorusPlan(params:Params,chorus:number,previousSummary?:string):ChorusPlan{
  const form=formForSeed(params);const bars:string[]=[];const sections:string[]=[];const centers:TonalCenterPlan[]=[];const phrases:PhraseTrace[]=[];
  let aFamily=weightedPick(A_FAMILIES,params,1000+chorus*101);
  if(previousSummary?.includes(aFamily.family)&&params.choruses>1){aFamily=weightedPick(A_FAMILIES,params,1040+chorus*103,new Set([aFamily.id]));}
  const append=(name:string,result:SectionResult,intent:string)=>{const base=bars.length;bars.push(...result.bars);sections.push(...Array(result.bars.length).fill(name));addMetadata(chorus,name,base,result,intent,centers,phrases);};

  if(form==='AABA'){
    append('A1',asASection(aFamily,'first'),'state a complete eight-bar harmonic sentence');
    append('A2',asASection(aFamily,'second'),'repeat the A grammar with a real second ending');
    let bridge=weightedPick(BRIDGES,params,1300+chorus*107);if(previousSummary?.includes(bridge.family))bridge=weightedPick(BRIDGES,params,1340+chorus*109,new Set([bridge.id]));
    append('B',{bars:[...bridge.bars],centers:[...bridge.centers],phrases:[bridge]},'move through planned temporary key centers and prepare the home-key return');
    append('A3',asASection(aFamily,'final'),'return to the same A grammar with a resolved final ending');
    return{bars,sections,centers,phrases,summary:`AABA · ${aFamily.family} · B ${bridge.family} · resolved A return`};
  }

  append('A1',asASection(aFamily,'first'),'state a complete eight-bar harmonic sentence');
  let b=weightedPick(BRIDGES,params,1600+chorus*127);if(previousSummary?.includes(b.family))b=weightedPick(BRIDGES,params,1640+chorus*131,new Set([b.id]));
  append('B',{bars:[...b.bars],centers:[...b.centers],phrases:[b]},'provide a contrasting planned tonal-center excursion');
  append('A2',asASection(aFamily,'second'),'return to the A grammar with its second ending');
  const c=weightedPick(C_SECTIONS,params,1780+chorus*137);
  append('C',{bars:[...c.bars],centers:[...c.centers],phrases:[c]},'close through one coherent related-key route');
  return{bars,sections,centers,phrases,summary:`ABAC · ${aFamily.family} · B ${b.family} · A return · C ${c.family}`};
}
