import type { Params, PhraseTrace, TonalCenterPlan } from './types';
import type { ChorusPlan } from './harmonyModel';

type Tag='cycle'|'tonicization'|'minor'|'diminished'|'backdoor'|'chromatic'|'tritone';
type Phrase={
  id:string;
  family:string;
  bars:string[];
  centers:string[];
  target:string;
  weight:number;
  minColor?:number;
  maxColor?:number;
  classic?:number;
  bebop?:number;
  tags?:Tag[];
};
type SectionResult={bars:string[];centers:string[];phrases:Phrase[]};

/**
 * v4 design rule: complexity comes primarily from TONAL DESTINATIONS, not from cramming
 * two altered chords into every bar. These phrase blocks deliberately resemble the density
 * of real fake-book standards: usually one harmony per bar, with two chords reserved for
 * cadences, tonicizations and turnarounds.
 */
const A_OPENERS:Phrase[]=[
  {
    id:'a-songbook-dim',family:'songbook diminished approach',target:'V',weight:34,
    bars:['IΔ9','#i°7','ii9','V13'],centers:['I','#i°','ii','V'],tags:['diminished','cycle'],
  },
  {
    id:'a-cycle-to-iv',family:'ii–V–I to IV',target:'IV',weight:32,
    bars:['ii9','V13','IΔ9','IVΔ9'],centers:['ii','V','I','IV'],tags:['cycle'],classic:1.15,
  },
  {
    id:'a-relative-minor',family:'relative-minor tonicization',target:'ii',weight:28,minColor:18,
    bars:['IΔ9','V7/vi','vi9','V7/ii'],centers:['I','vi','ii'],tags:['tonicization','minor','cycle'],
  },
  {
    id:'a-subdominant',family:'subdominant / diminished launch',target:'I',weight:24,minColor:24,
    bars:['IΔ9','I7','IVΔ9','#iv°7'],centers:['I','IV','#iv°','I'],tags:['tonicization','diminished'],
  },
  {
    id:'a-biii-side',family:'chromatic side-step tonicization',target:'ii',weight:11,minColor:62,
    bars:['IΔ9','ii7/bIII,V7/bIII','bIIIΔ9','V7/ii'],centers:['I','bIII','ii'],tags:['tonicization','chromatic'],bebop:1.25,
  },
];

const A_CONTINUATIONS:Phrase[]=[
  {
    id:'a-cont-cycle',family:'iii–VI–ii–V',target:'V',weight:38,
    bars:['iii7','VI7','ii9','V13'],centers:['iii','VI','ii','V'],tags:['cycle'],
  },
  {
    id:'a-cont-minor',family:'minor detour to ii–V',target:'V',weight:24,minColor:20,
    bars:['iiø7/vi','V7b9/vi','vi9,V7/ii','ii9,V13'],centers:['vi','ii','V'],tags:['minor','tonicization','cycle'],
  },
  {
    id:'a-cont-backdoor',family:'subdominant backdoor',target:'I',weight:23,minColor:28,
    bars:['IVΔ9','iv7','bVII7','IΔ9'],centers:['IV','iv','bVII','I'],tags:['backdoor'],classic:1.2,
  },
  {
    id:'a-cont-turn',family:'compact turnaround',target:'V',weight:30,
    bars:['I6/9','VI7','ii9,V13','I6/9,V7'],centers:['I','VI','ii','V','I','V'],tags:['cycle'],bebop:1.1,
  },
];

const A_FINALS:Phrase[]=[
  {
    id:'a-final-cycle',family:'resolved iii–VI–ii–V',target:'I',weight:38,
    bars:['iii7,VI7','ii9,V13','IΔ9','I6/9'],centers:['iii','VI','ii','V','I'],tags:['cycle'],
  },
  {
    id:'a-final-backdoor',family:'plagal / backdoor close',target:'I',weight:28,minColor:22,
    bars:['IVΔ9','iv7,bVII7','IΔ9','I6/9'],centers:['IV','iv','bVII','I'],tags:['backdoor'],classic:1.2,
  },
  {
    id:'a-final-minor',family:'relative-minor return',target:'I',weight:22,minColor:32,
    bars:['iiø7/vi,V7b9/vi','vi9','ii9,V7alt','I6/9'],centers:['vi','ii','V','I'],tags:['minor','tonicization','cycle'],
  },
  {
    id:'a-final-dim',family:'diminished turnaround close',target:'I',weight:18,minColor:34,
    bars:['IVΔ9','#iv°7','ii9,V13','I6/9'],centers:['IV','#iv°','ii','V','I'],tags:['diminished','cycle'],bebop:1.2,
  },
];

/** Bridge families are based on recurring fake-book behaviors rather than isolated substitutions. */
const BRIDGES:Phrase[]=[
  {
    id:'b-dominant-cycle',family:'dominant-cycle bridge',target:'V',weight:26,maxColor:66,
    bars:['III7','VI7','II7','V7','iii7','VI7','ii9','V13'],centers:['III','VI','II','V','iii','VI','ii','V'],tags:['cycle'],bebop:1.25,
  },
  {
    // The tonal-center logic behind many chromatic-third songbook bridges: IV -> bII -> VI -> bII -> home prep.
    id:'b-third-centers',family:'third-related major-center bridge',target:'V',weight:31,minColor:28,
    bars:['IVΔ9','ii7/bII,V7/bII','bIIΔ9','ii7/VI,V7/VI','VIΔ9','ii7/bII,V7/bII','bIIΔ9','ii9,V7alt'],
    centers:['IV','bII','VI','bII','ii','V'],tags:['tonicization','chromatic','cycle'],classic:1.2,
  },
  {
    id:'b-sequential-centers',family:'sequential ii–V center bridge',target:'V',weight:30,minColor:24,
    bars:['ii7/III,V7/III','IIIΔ9','ii7/VI,V7/VI','VIΔ9','ii7/II,V7/II','II7','ii7/V,V7/V','V7'],
    centers:['III','VI','II','V'],tags:['tonicization','cycle'],
  },
  {
    id:'b-minor-major',family:'minor-to-major center bridge',target:'V',weight:27,minColor:34,
    bars:['iiø7/vi','V7b9/vi','vi9','ii7/bIII,V7/bIII','bIIIΔ9','ii7/IV,V7/IV','IVΔ9','ii9,V7alt'],
    centers:['vi','bIII','IV','ii','V'],tags:['minor','tonicization','chromatic'],
  },
  {
    id:'b-subdominant',family:'subdominant / backdoor bridge',target:'V',weight:22,minColor:18,
    bars:['ii7/IV','V7/IV','IVΔ9','iv7','bVII7','iii7,VI7','ii9','V7alt'],
    centers:['IV','iv','bVII','iii','VI','ii','V'],tags:['tonicization','backdoor','cycle'],classic:1.25,
  },
  {
    id:'b-tritone',family:'tritone dominant bridge',target:'V',weight:3,minColor:88,
    bars:['III7','subV/VI','VI7','subV/II','II7','subV/V','ii9','V7alt'],centers:['III','subV/VI','VI','subV/II','II','subV/V','ii','V'],tags:['tritone','chromatic'],bebop:1.35,
  },
];

const C_SECTIONS:Phrase[]=[
  {
    id:'c-subdominant',family:'subdominant closing section',target:'I',weight:37,
    bars:['ii7/IV','V7/IV','IVΔ9','iv7,bVII7','iii7','VI7','ii9,V13','I6/9'],
    centers:['IV','iv','bVII','iii','VI','ii','V','I'],tags:['tonicization','backdoor','cycle'],
  },
  {
    id:'c-relative-minor',family:'relative-minor closing section',target:'I',weight:30,minColor:24,
    bars:['iiø7/vi','V7b9/vi','vi9','V7/ii','ii9','V13','IΔ9','I6/9'],
    centers:['vi','ii','V','I'],tags:['minor','tonicization','cycle'],
  },
  {
    id:'c-major-centers',family:'chromatic major-center closing section',target:'I',weight:17,minColor:52,
    bars:['ii7/bIII,V7/bIII','bIIIΔ9','ii7/III,V7/III','IIIΔ9','ii7/VI,V7/VI','VI7','ii9,V7alt','I6/9'],
    centers:['bIII','III','VI','ii','V','I'],tags:['chromatic','tonicization','cycle'],bebop:1.2,
  },
  {
    id:'c-songbook',family:'songbook turnaround close',target:'I',weight:28,
    bars:['IVΔ9','#iv°7','I6/9','VI7','ii9','V13','IΔ9','I6/9'],
    centers:['IV','#iv°','I','VI','ii','V','I'],tags:['diminished','cycle'],classic:1.15,
  },
];

function hashSeed(seed:number,salt:number):number{
  let x=(seed^Math.imul(salt+1,0x9e3779b9))>>>0;
  x^=x<<13;x>>>=0;x^=x>>>17;x>>>=0;x^=x<<5;x>>>=0;
  return x>>>0;
}
function unit(seed:number,salt:number):number{return hashSeed(seed,salt)/0xffffffff;}

function tagMultiplier(tags:Tag[]|undefined,color:number):number{
  const t=new Set(tags??[]);
  let m=1;
  if(t.has('cycle'))m*=1.15;
  if(t.has('tonicization'))m*=0.88+color/170;
  if(t.has('minor'))m*=0.85+color/190;
  if(t.has('diminished'))m*=0.75+color/210;
  if(t.has('backdoor'))m*=0.70+color/170;
  if(t.has('chromatic'))m*=0.45+color/110;
  if(t.has('tritone'))m*=0.10+color/120;
  return m;
}

function pick(pool:Phrase[],params:Params,salt:number,blocked=new Set<string>()):Phrase{
  const candidates=pool.filter(p=>(p.minColor===undefined||params.color>=p.minColor)&&(p.maxColor===undefined||params.color<=p.maxColor)&&!blocked.has(p.id));
  if(!candidates.length)throw new Error('No standard-form phrase candidates fit this harmonic distance.');
  const weighted=candidates.map(p=>({p,w:p.weight*(params.preset==='bebop'?(p.bebop??1):(p.classic??1))*tagMultiplier(p.tags,params.color)}));
  const total=weighted.reduce((s,x)=>s+x.w,0);
  let cursor=unit(params.seed,salt)*total;
  for(const x of weighted){cursor-=x.w;if(cursor<=0)return x.p;}
  return weighted[weighted.length-1].p;
}

function makeA(
  params:Params,
  salt:number,
  final:boolean,
  forcedOpener?:Phrase,
  blockedCloser=new Set<string>(),
):SectionResult{
  const opener=forcedOpener??pick(A_OPENERS,params,salt);
  const closer=pick(final?A_FINALS:A_CONTINUATIONS,params,salt+31,blockedCloser);
  return{bars:[...opener.bars,...closer.bars],centers:[...opener.centers,...closer.centers],phrases:[opener,closer]};
}

function addMetadata(chorus:number,section:string,base:number,result:SectionResult,intent:string,centers:TonalCenterPlan[],phrases:PhraseTrace[]):void{
  centers.push({chorus,section,centers:result.centers,mode:'major',intent});
  let cursor=base;
  for(const p of result.phrases){
    phrases.push({chorus,section,startBar:cursor,endBar:cursor+p.bars.length-1,family:p.family,target:p.target,templateId:p.id});
    cursor+=p.bars.length;
  }
}

function formForSeed(params:Params):'AABA'|'ABAC'{
  const aabaChance=params.preset==='classic'?0.64:0.56;
  return unit(params.seed,11)<aabaChance?'AABA':'ABAC';
}

export function buildStandardChorusPlan(params:Params,chorus:number,previousSummary?:string):ChorusPlan{
  const form=formForSeed(params);
  const bars:string[]=[];
  const sections:string[]=[];
  const centers:TonalCenterPlan[]=[];
  const phrases:PhraseTrace[]=[];

  const a1=makeA(params,1000+chorus*101,false);
  // A2 normally keeps the same opening four bars, like a real A section with a different ending.
  // At high harmonic distance it may develop the opening too, but still uses the same phrase grammar.
  const reuseA1=params.color<72||unit(params.seed,1080+chorus)<0.68;
  const a2=makeA(params,1120+chorus*103,false,reuseA1?a1.phrases[0]:undefined,new Set([a1.phrases[1].id]));

  const append=(name:string,result:SectionResult,intent:string)=>{
    const base=bars.length;
    bars.push(...result.bars);
    sections.push(...Array(result.bars.length).fill(name));
    addMetadata(chorus,name,base,result,intent,centers,phrases);
  };

  if(form==='AABA'){
    append('A1',a1,'state an 8-bar songbook phrase and lead into a contrasting second ending');
    append('A2',a2,'repeat/develop the A identity with a different cadence rather than generating unrelated chords');

    let bridge=pick(BRIDGES,params,1300+chorus*107);
    if(previousSummary?.includes(bridge.family))bridge=pick(BRIDGES,params,1340+chorus*109,new Set([bridge.id]));
    append('B',{bars:[...bridge.bars],centers:[...bridge.centers],phrases:[bridge]},'move through a planned chain of temporary key centers, then prepare the return home');

    const a3=makeA(params,1460+chorus*113,true,a1.phrases[0]);
    append('A3',a3,'recall the opening A phrase and use a resolved final cadence');
    return{bars,sections,centers,phrases,summary:`AABA · ${a1.phrases[0].family} · B ${bridge.family} · resolved A return`};
  }

  append('A1',a1,'state the main 8-bar harmonic identity');
  let b=pick(BRIDGES,params,1600+chorus*127);
  if(previousSummary?.includes(b.family))b=pick(BRIDGES,params,1640+chorus*131,new Set([b.id]));
  append('B',{bars:[...b.bars],centers:[...b.centers],phrases:[b]},'provide a true contrasting tonal-center excursion');
  append('A2',a2,'return to the opening phrase with a changed ending');
  const c=pick(C_SECTIONS,params,1780+chorus*137);
  append('C',{bars:[...c.bars],centers:[...c.centers],phrases:[c]},'close through a coherent related-key route rather than a random substitution chain');
  return{bars,sections,centers,phrases,summary:`ABAC · ${a1.phrases[0].family} · B ${b.family} · A return · C ${c.family}`};
}
