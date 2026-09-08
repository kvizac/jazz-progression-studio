import type { Params, PhraseTrace, TonalCenterPlan } from './types';
import type { ChorusPlan } from './harmonyModel';

type Tag = 'cycle'|'tonicization'|'minor'|'diminished'|'backdoor'|'tritone'|'modal'|'chromatic';
type Phrase = {
  id: string;
  family: string;
  bars: string[];
  centers: string[];
  target: string;
  weight: number;
  minColor?: number;
  maxColor?: number;
  classic?: number;
  bebop?: number;
  tags?: Tag[];
};

type SectionResult = {
  bars: string[];
  centers: string[];
  phrases: Phrase[];
};

const OPENERS: Phrase[] = [
  {
    id:'open-home-cycle', family:'tonic cycle', target:'V',
    bars:['IΔ9','VI7alt','ii9','V13'], centers:['I','VI','ii','V'], weight:38, tags:['cycle'],
  },
  {
    id:'open-subdominant', family:'subdominant tonicization', target:'IV',
    bars:['IΔ9','ii7/IV,V7/IV','IVΔ9','iv7,bVII7'], centers:['I','IV','iv','bVII'], weight:28, minColor:20,
    tags:['tonicization','backdoor','modal'], classic:1.15,
  },
  {
    id:'open-relative-minor', family:'relative-minor detour', target:'vi',
    bars:['IΔ9','iiø7/vi,V7b9/vi','vi9','II7'], centers:['I','vi','II'], weight:26, minColor:24,
    tags:['tonicization','minor','cycle'], bebop:1.15,
  },
  {
    id:'open-mediant', family:'mediant tonicization', target:'III',
    bars:['IΔ9','ii7/III,V7/III','IIIΔ7','ii7/VI,V7/VI'], centers:['I','III','VI'], weight:15, minColor:42,
    tags:['tonicization','chromatic'], bebop:1.15,
  },
  {
    id:'open-diminished', family:'diminished connector', target:'ii',
    bars:['I6','#i°7','ii9,V13','I6,VI7alt'], centers:['I','#i°','ii','V','I','VI'], weight:14, minColor:35,
    tags:['diminished','cycle'], bebop:1.3,
  },
];

const CLOSERS: Phrase[] = [
  {
    id:'close-cycle', family:'iii–VI–ii–V cadence', target:'I',
    bars:['iii7,VI7alt','ii9,V13','I6/9,VI7alt','ii9,V7alt'], centers:['iii','VI','ii','V','I'], weight:38, tags:['cycle'],
  },
  {
    id:'close-plagal', family:'subdominant / backdoor return', target:'I',
    bars:['ii7/IV,V7/IV','IVΔ9','iv7,bVII7','I6/9'], centers:['IV','iv','bVII','I'], weight:27, minColor:22,
    tags:['tonicization','backdoor','modal'], classic:1.15,
  },
  {
    id:'close-minor', family:'minor detour return', target:'I',
    bars:['iiø7/vi,V7b9/vi','vi9','ii9,V7alt','I6/9'], centers:['vi','ii','V','I'], weight:22, minColor:30,
    tags:['minor','tonicization','cycle'],
  },
  {
    id:'close-dim', family:'diminished turnaround', target:'I',
    bars:['I7','IVΔ9,#iv°7','I6,VI7alt','ii9,V13'], centers:['I','IV','#iv°','I','VI','ii','V'], weight:16, minColor:36,
    tags:['diminished','cycle'], bebop:1.3,
  },
  {
    id:'close-tritone', family:'tritone cadence', target:'I',
    bars:['iii7,VI7alt','ii9,subV/I','IΔ9','ii9,V7alt'], centers:['iii','VI','ii','subV','I'], weight:8, minColor:66,
    tags:['tritone','chromatic'], bebop:1.45,
  },
];

const BRIDGES: Phrase[] = [
  {
    id:'bridge-dominant-cycle', family:'dominant-cycle bridge', target:'V',
    bars:['III7','III7','VI7','VI7','II7','II7','V7','V7'], centers:['III','VI','II','V'], weight:34, tags:['cycle'],
  },
  {
    id:'bridge-iiv-centers', family:'ii–V tonal-center bridge', target:'V',
    bars:['ii7/III,V7/III','IIIΔ7','ii7/VI,V7/VI','VIΔ7','ii7/II,V7/II','II7','ii7/V,V7/V','V7'],
    centers:['III','VI','II','V'], weight:31, minColor:24, tags:['tonicization','cycle'], classic:1.1,
  },
  {
    id:'bridge-minor-major', family:'minor / major center bridge', target:'V',
    bars:['iiø7/vi,V7b9/vi','vi9','ii7/bIII,V7/bIII','bIIIΔ7','ii7/IV,V7/IV','IVΔ9','ii9','V7alt'],
    centers:['vi','bIII','IV','V'], weight:24, minColor:38, tags:['minor','tonicization','chromatic'],
  },
  {
    id:'bridge-mediants', family:'chromatic mediant bridge', target:'V',
    bars:['ii7/III,V7/III','IIIΔ7','ii7/bIII,V7/bIII','bIIIΔ7','ii7/VI,V7/VI','VI7','II7','V7'],
    centers:['III','bIII','VI','II','V'], weight:13, minColor:56, tags:['tonicization','chromatic'], bebop:1.2,
  },
  {
    id:'bridge-tritone', family:'tritone dominant bridge', target:'V',
    bars:['III7','subV/VI','VI7','subV/II','II7','subV/V','V7','V7'], centers:['III','subV/VI','VI','subV/II','II','subV/V','V'],
    weight:6, minColor:76, tags:['tritone','chromatic'], bebop:1.5,
  },
];

const C_SECTIONS: Phrase[] = [
  {
    id:'c-subdominant', family:'subdominant closing section', target:'I',
    bars:['ii7/IV,V7/IV','IVΔ9','iv7,bVII7','IΔ9','iii7,VI7alt','ii9,V13','I6/9,VI7alt','ii9,V7alt'],
    centers:['IV','iv','bVII','I','iii','VI','ii','V','I'], weight:34, tags:['tonicization','backdoor','cycle'],
  },
  {
    id:'c-minor', family:'relative-minor closing section', target:'I',
    bars:['iiø7/vi,V7b9/vi','vi9','ii7/IV,V7/IV','IVΔ9','iv7,bVII7','I6/9,VI7alt','ii9,V13','I6/9'],
    centers:['vi','IV','iv','bVII','I','VI','ii','V','I'], weight:28, minColor:28, tags:['minor','tonicization','backdoor','cycle'],
  },
  {
    id:'c-mediant', family:'chromatic-center closing section', target:'I',
    bars:['ii7/bIII,V7/bIII','bIIIΔ7','ii7/III,V7/III','IIIΔ7','ii7/VI,V7/VI','VI7','ii9,subV/I','IΔ9'],
    centers:['bIII','III','VI','ii','subV','I'], weight:14, minColor:54, tags:['chromatic','tonicization','tritone'], bebop:1.25,
  },
];

function hashSeed(seed:number,salt:number):number {
  let x=(seed ^ Math.imul(salt+1,0x9e3779b9))>>>0;
  x^=x<<13; x>>>=0; x^=x>>>17; x>>>=0; x^=x<<5; x>>>=0;
  return x>>>0;
}
function unit(seed:number,salt:number):number { return hashSeed(seed,salt)/0xffffffff; }

function tagMultiplier(tags:Tag[]|undefined,color:number):number {
  const t=new Set(tags??[]);
  let m=1;
  if(t.has('cycle')) m*=1.18;
  if(t.has('tonicization')) m*=0.82+color/125;
  if(t.has('minor')) m*=0.82+color/160;
  if(t.has('diminished')) m*=0.58+color/100;
  if(t.has('backdoor')||t.has('modal')) m*=0.48+color/105;
  if(t.has('chromatic')) m*=0.42+color/90;
  if(t.has('tritone')) m*=0.18+color/85;
  return m;
}

function pick(pool:Phrase[],params:Params,salt:number,blocked=new Set<string>()):Phrase {
  const candidates=pool.filter(p=>(p.minColor===undefined||params.color>=p.minColor)&&(p.maxColor===undefined||params.color<=p.maxColor)&&!blocked.has(p.id));
  if(!candidates.length) throw new Error('No standard-form phrase candidates fit this harmonic color.');
  const weighted=candidates.map(p=>({
    p,
    w:p.weight*(params.preset==='bebop'?(p.bebop??1):(p.classic??1))*tagMultiplier(p.tags,params.color),
  }));
  const total=weighted.reduce((s,x)=>s+x.w,0);
  let cursor=unit(params.seed,salt)*total;
  for(const x of weighted){ cursor-=x.w; if(cursor<=0) return x.p; }
  return weighted[weighted.length-1].p;
}

function makeA(params:Params,salt:number,blockedOpen=new Set<string>(),blockedClose=new Set<string>()):SectionResult {
  const opener=pick(OPENERS,params,salt,blockedOpen);
  const closer=pick(CLOSERS,params,salt+19,blockedClose);
  return {bars:[...opener.bars,...closer.bars],centers:[...opener.centers,...closer.centers],phrases:[opener,closer]};
}

function addSectionMetadata(
  chorus:number,
  section:string,
  baseBar:number,
  result:SectionResult,
  intent:string,
  centers:TonalCenterPlan[],
  phrases:PhraseTrace[],
):void {
  centers.push({chorus,section,centers:result.centers,mode:'major',intent});
  let cursor=baseBar;
  result.phrases.forEach(p=>{
    phrases.push({chorus,section,startBar:cursor,endBar:cursor+p.bars.length-1,family:p.family,target:p.target,templateId:p.id});
    cursor+=p.bars.length;
  });
}

function formForSeed(params:Params):'AABA'|'ABAC' {
  const roll=unit(params.seed,11);
  const aabaChance=params.preset==='classic'?0.62:0.54;
  return roll<aabaChance?'AABA':'ABAC';
}

export function buildStandardChorusPlan(params:Params,chorus:number,previousSummary?:string):ChorusPlan {
  const form=formForSeed(params);
  const centers:TonalCenterPlan[]=[];
  const phrases:PhraseTrace[]=[];
  const sections:string[]=[];
  const bars:string[]=[];

  const a1=makeA(params,1000+chorus*101);
  const a1Open=a1.phrases[0].id;
  const a1Close=a1.phrases[1].id;

  const a2=makeA(params,1120+chorus*103,new Set([a1Open]),new Set([a1Close]));
  // A sections share identity, but are not literal copies. At normal color, A2 keeps either
  // the opener or the closer family relationship while changing the other half.
  if(params.color<70 && unit(params.seed,1170+chorus)<0.5){
    a2.phrases[0]=a1.phrases[0];
    a2.bars=[...a2.phrases[0].bars,...a2.phrases[1].bars];
    a2.centers=[...a2.phrases[0].centers,...a2.phrases[1].centers];
  }

  const append=(name:string,result:SectionResult,intent:string)=>{
    const base=bars.length;
    bars.push(...result.bars); sections.push(...Array(result.bars.length).fill(name));
    addSectionMetadata(chorus,name,base,result,intent,centers,phrases);
  };

  if(form==='AABA'){
    append('A1',a1,'establish the home key and expose the tune’s main harmonic vocabulary');
    append('A2',a2,'develop A1 while redirecting the cadence toward the bridge');

    let bridge=pick(BRIDGES,params,1300+chorus*107);
    if(previousSummary?.includes(bridge.family)) bridge=pick(BRIDGES,params,1330+chorus*109,new Set([bridge.id]));
    const bridgeResult:SectionResult={bars:[...bridge.bars],centers:[...bridge.centers],phrases:[bridge]};
    append('B',bridgeResult,'leave the home key through a contrasting tonal-center sequence and prepare the return');

    const a3=makeA(params,1460+chorus*113,new Set(),new Set([a1Close]));
    // Strong thematic return: reuse A1 opening unless color is deliberately extreme.
    if(params.color<82){
      a3.phrases[0]=a1.phrases[0];
      a3.bars=[...a3.phrases[0].bars,...a3.phrases[1].bars];
      a3.centers=[...a3.phrases[0].centers,...a3.phrases[1].centers];
    }
    append('A3',a3,'return to the A-section identity and close the form with a fresh cadence');
    return {
      bars,sections,centers,phrases,
      summary:`AABA · A1 ${a1.phrases[0].family} · A2 ${a2.phrases[0].family} · B ${bridge.family} · A3 return`,
    };
  }

  append('A1',a1,'establish the home key and the main harmonic vocabulary');
  let b=pick(BRIDGES,params,1600+chorus*127);
  if(previousSummary?.includes(b.family)) b=pick(BRIDGES,params,1630+chorus*131,new Set([b.id]));
  append('B',{bars:[...b.bars],centers:[...b.centers],phrases:[b]},'contrast A with a genuine tonal excursion rather than a decorated turnaround');

  // In ABAC, A2 recalls A1 more strongly because the final section will be new material.
  a2.phrases[0]=a1.phrases[0];
  a2.bars=[...a2.phrases[0].bars,...a2.phrases[1].bars];
  a2.centers=[...a2.phrases[0].centers,...a2.phrases[1].centers];
  append('A2',a2,'return to A material with a changed cadence');

  const c=pick(C_SECTIONS,params,1780+chorus*137);
  append('C',{bars:[...c.bars],centers:[...c.centers],phrases:[c]},'introduce new closing material that travels through related centers before resolving home');
  return {
    bars,sections,centers,phrases,
    summary:`ABAC · A ${a1.phrases[0].family} · B ${b.family} · A return · C ${c.family}`,
  };
}

export const STANDARD_FORM_LENGTH=32;
