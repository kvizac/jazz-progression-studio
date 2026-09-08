import type { Params, PhraseTrace, TonalCenterPlan, TonalMode } from './types';

type SectionRole =
  | 'cadence-major'
  | 'cadence-minor'
  | 'blues-opening'
  | 'blues-middle'
  | 'blues-turnaround'
  | 'rhythm-a1'
  | 'rhythm-a2'
  | 'rhythm-bridge'
  | 'rhythm-a3';

type PhraseSlot = 'whole'|'a-open'|'a-close';

type PhraseTemplate = {
  id: string;
  family: string;
  target: string;
  centers: string[];
  bars: string[];
  baseWeight: number;
  minColor?: number;
  maxColor?: number;
  classic?: number;
  bebop?: number;
  roles?: SectionRole[];
  slot?: PhraseSlot;
  tags?: Array<'cycle'|'tonicization'|'diminished'|'backdoor'|'tritone'|'modal'|'altered'>;
};

type SectionPlan = {
  name: string;
  role: SectionRole;
  bars: number;
  mode: TonalMode;
  intent: string;
};

type RhythmAPlan = {
  opener: PhraseTemplate;
  closer: PhraseTemplate;
  bars: string[];
  centers: string[];
  traces: Array<{family:string;target:string;id:string;len:number}>;
  pair: string;
};

export type ChorusPlan = {
  bars: string[];
  sections: string[];
  summary: string;
  centers: TonalCenterPlan[];
  phrases: PhraseTrace[];
};

const CANONICAL: Record<Params['type'], Record<Params['preset'], { bars: string[]; sections: string[]; name: string }>> = {
  iivi: {
    classic: { name:'Canonical ii–V–I', bars:['ii7','V7','IΔ7','IΔ7'], sections:Array(4).fill('Cadence') },
    bebop: { name:'Bebop ii–V–I', bars:['ii7','V7','IΔ7','IΔ7'], sections:Array(4).fill('Cadence') },
  },
  iimino: {
    classic: { name:'Canonical minor cadence', bars:['iiø7','V7alt','i-Δ','i-Δ'], sections:Array(4).fill('Cadence') },
    bebop: { name:'Bebop minor cadence', bars:['iiø7','V7alt','i-Δ','i-Δ'], sections:Array(4).fill('Cadence') },
  },
  blues: {
    classic: {
      name:'Classic jazz blues',
      bars:['I7','IV7','I7','I7','IV7','#iv°7','I7','VI7','ii7','V7','I7','V7'],
      sections:[...Array(4).fill('A1'),...Array(4).fill('A2'),...Array(4).fill('A3')],
    },
    bebop: {
      name:'Bebop blues',
      bars:['I7','IV7','I7','VI7','ii7','V7','I7','VI7','ii7','V7','I7,VI7','ii7,V7'],
      sections:[...Array(4).fill('A1'),...Array(4).fill('A2'),...Array(4).fill('A3')],
    },
  },
  rhythm: {
    classic: {
      name:'Classic rhythm changes',
      bars:[
        'IΔ6','VI7','ii7','V7','IΔ6','VI7','ii7','V7',
        'IΔ6','IV7','iii7','VI7','ii7','V7','IΔ6','VI7',
        'III7','VI7','II7','V7','III7','VI7','II7','V7',
        'IΔ6','VI7','ii7','V7','IΔ6','ii7,V7','IΔ6','V7',
      ],
      sections:[...Array(8).fill('A1'),...Array(8).fill('A2'),...Array(8).fill('B'),...Array(8).fill('A3')],
    },
    bebop: {
      name:'Parker rhythm changes',
      bars:[
        'IΔ6','VI7','ii7','V7','bIII°7','IΔ6','#iv°7','V7/ii',
        'ii7','V7','IΔ6','VI7','ii7','V7','IΔ6','VI7',
        'III7','VI7','II7','V7','III7','VI7','II7','V7',
        'IΔ6','VI7','ii7','V7','IΔ6','ii7,V7','IΔ6','V7',
      ],
      sections:[...Array(8).fill('A1'),...Array(8).fill('A2'),...Array(8).fill('B'),...Array(8).fill('A3')],
    },
  },
};

const FORM: Record<Params['type'], SectionPlan[]> = {
  iivi: [{name:'Cadence',role:'cadence-major',bars:4,mode:'major',intent:'resolve a major ii–V into tonic'}],
  iimino: [{name:'Cadence',role:'cadence-minor',bars:4,mode:'minor',intent:'resolve a minor iiø–V into tonic minor'}],
  blues: [
    {name:'A1',role:'blues-opening',bars:4,mode:'dominant',intent:'establish tonic blues and prepare IV'},
    {name:'A2',role:'blues-middle',bars:4,mode:'dominant',intent:'move through IV and return toward tonic'},
    {name:'A3',role:'blues-turnaround',bars:4,mode:'dominant',intent:'create a ii–V / dominant turnaround back to I'},
  ],
  rhythm: [
    {name:'A1',role:'rhythm-a1',bars:8,mode:'major',intent:'state tonic and a compact turnaround vocabulary'},
    {name:'A2',role:'rhythm-a2',bars:8,mode:'major',intent:'develop A1 with a related tonicization or subdominant excursion'},
    {name:'B',role:'rhythm-bridge',bars:8,mode:'dominant',intent:'leave tonic through a dominant-cycle bridge'},
    {name:'A3',role:'rhythm-a3',bars:8,mode:'major',intent:'return to tonic with recognizable A-family material and a stronger cadence'},
  ],
};

/**
 * Corpus-informed priors, not copied lead sheets. Public corpus research consistently shows
 * strong cycle-of-fifths motion and frequent tonicization; backdoor/modal paths occur less
 * often; tritone/altered routes are kept rarer and rise with Harmonic Color.
 */
const PHRASES: PhraseTemplate[] = [
  // Major cadences (4 bars)
  { id:'maj-canonical', family:'major cadence', target:'I', centers:['ii','V','I'], bars:['ii9','V13','IΔ9','I6/9'], baseWeight:34, roles:['cadence-major'], slot:'whole', tags:['cycle'] },
  { id:'maj-altered', family:'major cadence', target:'I', centers:['iii','VI','ii','V','I'], bars:['iii7,VI7alt','ii9,V7alt','IΔ9','I6/9'], baseWeight:24, minColor:28, roles:['cadence-major'], slot:'whole', tags:['cycle','altered','tonicization'], bebop:1.35 },
  { id:'maj-backdoor', family:'backdoor cadence', target:'I', centers:['ii','V','iv','bVII','I'], bars:['ii9','V7alt','iv7,bVII7','I6/9'], baseWeight:12, minColor:44, roles:['cadence-major'], slot:'whole', tags:['backdoor','modal'], classic:.8, bebop:1.1 },
  { id:'maj-tritone', family:'tritone cadence', target:'I', centers:['ii','subV','I'], bars:['ii9','subV#11/I','IΔ9#11','I6/9'], baseWeight:7, minColor:58, roles:['cadence-major'], slot:'whole', tags:['tritone','altered'], bebop:1.35 },

  // Minor cadences (4 bars)
  { id:'min-canonical', family:'minor cadence', target:'i', centers:['iiø','V','i'], bars:['iiø7','V7alt','i-Δ','i-6/9'], baseWeight:34, roles:['cadence-minor'], slot:'whole', tags:['cycle','altered'] },
  { id:'min-b9', family:'minor cadence', target:'i', centers:['iiø','V','i'], bars:['iiø7','V7b9','i-Δ','i-6/9'], baseWeight:28, roles:['cadence-minor'], slot:'whole', tags:['cycle'] },
  { id:'min-chain', family:'minor dominant chain', target:'i', centers:['iv','bVII','iiø','V','i'], bars:['iv7,bVII7','iiø7,V7alt','i-Δ','i-6/9'], baseWeight:12, minColor:42, roles:['cadence-minor'], slot:'whole', tags:['backdoor','modal','altered'] },
  { id:'min-tritone', family:'minor tritone cadence', target:'i', centers:['iiø','subV','i'], bars:['iiø7','subV/i','i-Δ','i-6/9'], baseWeight:6, minColor:62, roles:['cadence-minor'], slot:'whole', tags:['tritone'] },

  // Jazz blues opening 4 bars
  { id:'bl-open-cycle', family:'tonic to IV preparation', target:'IV', centers:['I','IV'], bars:['I13','IV9','I13','ii7/IV,V7/IV'], baseWeight:35, roles:['blues-opening'], slot:'whole', tags:['cycle','tonicization'] },
  { id:'bl-open-bird', family:'Parker dominant chain', target:'IV', centers:['I','vi','V','IV'], bars:['I7','iiø7/vi,V7b9/vi','ii7/V,V7/V','ii7/IV,V7/IV'], baseWeight:24, minColor:36, roles:['blues-opening'], slot:'whole', tags:['cycle','tonicization','altered'], bebop:1.55, classic:.55 },
  { id:'bl-open-turn', family:'turnaround opening', target:'IV', centers:['I','VI','ii','V','IV'], bars:['I13','I13,VI7alt','ii9,V13','ii7/IV,V7/IV'], baseWeight:18, minColor:28, roles:['blues-opening'], slot:'whole', tags:['cycle','altered'] },
  { id:'bl-open-chromatic', family:'chromatic approach to IV', target:'IV', centers:['I','#iv°','IV'], bars:['I13','I7','#iv°7','ii7/IV,V7/IV'], baseWeight:7, minColor:62, roles:['blues-opening'], slot:'whole', tags:['diminished','tonicization'], bebop:1.25 },

  // Jazz blues middle 4 bars
  { id:'bl-mid-dim', family:'IV and diminished return', target:'I', centers:['IV','#iv°','I','VI','ii','V'], bars:['IV9','#iv°7','I13,VI7alt','ii9,V13'], baseWeight:35, roles:['blues-middle'], slot:'whole', tags:['diminished','cycle','altered'] },
  { id:'bl-mid-backdoor', family:'IV minor backdoor return', target:'I', centers:['IV','iv','bVII','I','VI','ii','V'], bars:['IV9','iv7,bVII7','I13,VI7alt','ii9,V13'], baseWeight:16, minColor:42, roles:['blues-middle'], slot:'whole', tags:['backdoor','modal','altered'] },
  { id:'bl-mid-simple', family:'IV return', target:'I', centers:['IV','I','VI'], bars:['IV9','IV9','I13','VI7alt'], baseWeight:24, maxColor:68, roles:['blues-middle'], slot:'whole', tags:['cycle'] },
  { id:'bl-mid-tritone', family:'IV to tritone return', target:'I', centers:['IV','#iv°','I','subV'], bars:['IV9','#iv°7','I13,VI7alt','ii9,subV/I'], baseWeight:7, minColor:66, roles:['blues-middle'], slot:'whole', tags:['diminished','tritone','altered'], bebop:1.25 },

  // Jazz blues closing 4 bars
  { id:'bl-close-cycle', family:'iii–VI–ii–V turnaround', target:'I', centers:['iii','VI','ii','V','I'], bars:['iii7,VI7alt','ii9,V13','I6/9,VI7alt','ii9,V7alt'], baseWeight:38, roles:['blues-turnaround'], slot:'whole', tags:['cycle','altered'] },
  { id:'bl-close-bebop', family:'ii–V turnaround', target:'I', centers:['ii','V','I','VI'], bars:['ii9','V7alt','I6/9,VI7alt','ii9,V13'], baseWeight:28, roles:['blues-turnaround'], slot:'whole', tags:['cycle','altered'], bebop:1.2 },
  { id:'bl-close-backdoor', family:'backdoor turnaround', target:'I', centers:['iv','bVII','I','VI','ii','V'], bars:['iv7,bVII7','I6/9,VI7alt','ii9,V13','I6/9,V7'], baseWeight:10, minColor:46, roles:['blues-turnaround'], slot:'whole', tags:['backdoor','modal'] },
  { id:'bl-close-tritone', family:'tritone turnaround', target:'I', centers:['iii','VI','ii','subV','I'], bars:['iii7,VI7alt','ii9,subV/I','I6/9,VI7alt','ii9,subV/I'], baseWeight:6, minColor:68, roles:['blues-turnaround'], slot:'whole', tags:['tritone','altered'], bebop:1.35 },

  // Rhythm A openings (4 bars)
  { id:'rh-a-open-cycle', family:'tonic turnaround', target:'I', centers:['I','VI','ii','V','iii','VI','ii','V'], bars:['I6,VI7','ii7,V7','iii7,VI7','ii7,V7'], baseWeight:38, roles:['rhythm-a1','rhythm-a2','rhythm-a3'], slot:'a-open', tags:['cycle'] },
  { id:'rh-a-open-vi', family:'relative-minor tonicization', target:'I', centers:['I','vi','II','ii','V'], bars:['I6','iiø7/vi,V7b9/vi','vi7,II7','ii7,V7'], baseWeight:18, minColor:28, roles:['rhythm-a1','rhythm-a2','rhythm-a3'], slot:'a-open', tags:['tonicization','cycle'], bebop:1.15 },
  { id:'rh-a-open-dim', family:'diminished connector', target:'IV', centers:['I','bIII°','ii','V','I','IV'], bars:['I6,bIII°7','ii7,V7','I6,I7','IVΔ7,#iv°7'], baseWeight:14, minColor:34, roles:['rhythm-a1','rhythm-a2'], slot:'a-open', tags:['diminished','tonicization'], bebop:1.35 },
  { id:'rh-a-open-iv', family:'subdominant launch', target:'IV', centers:['I','IV'], bars:['I6,VI7','ii7,V7','I6,I7','ii7/IV,V7/IV'], baseWeight:16, minColor:24, roles:['rhythm-a2','rhythm-a3'], slot:'a-open', tags:['tonicization','cycle'] },

  // Rhythm A closings (4 bars)
  { id:'rh-a-close-dim', family:'IV diminished return', target:'I', centers:['IV','#iv°','I','VI','ii','V'], bars:['I6,I7','IVΔ7,#iv°7','I6,VI7alt','ii9,V13'], baseWeight:34, roles:['rhythm-a1','rhythm-a2','rhythm-a3'], slot:'a-close', tags:['diminished','cycle','altered'] },
  { id:'rh-a-close-cycle', family:'turnaround return', target:'I', centers:['iii','VI','ii','V','I'], bars:['iii7,VI7alt','ii9,V13','I6,VI7alt','ii9,V7alt'], baseWeight:32, roles:['rhythm-a1','rhythm-a2','rhythm-a3'], slot:'a-close', tags:['cycle','altered'] },
  { id:'rh-a-close-backdoor', family:'backdoor return', target:'I', centers:['iv','bVII','I','VI','ii','V'], bars:['iv7,bVII7','I6,VI7alt','ii9,V13','I6,V7'], baseWeight:11, minColor:48, roles:['rhythm-a2','rhythm-a3'], slot:'a-close', tags:['backdoor','modal','cycle'] },
  { id:'rh-a-close-tritone', family:'tritone return', target:'I', centers:['iii','VI','ii','subV','I'], bars:['iii7,VI7alt','ii9,subV/I','I6,VI7alt','ii9,V7alt'], baseWeight:6, minColor:68, roles:['rhythm-a2','rhythm-a3'], slot:'a-close', tags:['tritone','altered'], bebop:1.35 },

  // Rhythm bridge (8 bars)
  { id:'rh-b-direct', family:'dominant-cycle bridge', target:'V', centers:['III','VI','II','V'], bars:['III7','VI7','II7','V7','III7','VI7','II7','V7'], baseWeight:42, roles:['rhythm-bridge'], slot:'whole', tags:['cycle'] },
  { id:'rh-b-iiv', family:'ii–V bridge chain', target:'V', centers:['VI','II','V','I'], bars:['ii7/VI,V7/VI','VI7','ii7/II,V7/II','II7','ii7/V,V7/V','V7','ii7/I,V7/I','V7'], baseWeight:22, minColor:34, roles:['rhythm-bridge'], slot:'whole', tags:['cycle','tonicization'], bebop:1.35 },
  { id:'rh-b-mixed', family:'mixed dominant / ii–V bridge', target:'V', centers:['III','VI','II','V'], bars:['III7','ii7/VI,V7/VI','VI7','ii7/II,V7/II','II7','ii7/V,V7/V','V7','V7'], baseWeight:16, minColor:42, roles:['rhythm-bridge'], slot:'whole', tags:['cycle','tonicization'] },
  { id:'rh-b-tritone', family:'chromatic dominant bridge', target:'V', centers:['III','VI','II','V'], bars:['III7','subV/VI','VI7','subV/II','II7','subV/V','V7','V7'], baseWeight:5, minColor:74, roles:['rhythm-bridge'], slot:'whole', tags:['tritone'], bebop:1.45 },
];

function hashSeed(seed: number, salt: number): number {
  let x = (seed ^ Math.imul(salt + 1, 0x9e3779b9)) >>> 0;
  x ^= x << 13; x >>>= 0;
  x ^= x >>> 17; x >>>= 0;
  x ^= x << 5; x >>>= 0;
  return x >>> 0;
}

function unit(seed: number, salt: number): number {
  return hashSeed(seed, salt) / 0xffffffff;
}

function weightedPick<T>(items: Array<{item:T;weight:number}>, seed:number, salt:number): T {
  if (!items.length) throw new Error('No harmonic phrase candidates are available for this context.');
  const total = items.reduce((sum,x)=>sum+x.weight,0);
  let cursor = unit(seed,salt) * total;
  for (const candidate of items) {
    cursor -= candidate.weight;
    if (cursor <= 0) return candidate.item;
  }
  return items[items.length-1].item;
}

function chromaticMultiplier(template: PhraseTemplate, color: number): number {
  const tags = new Set(template.tags ?? []);
  let m = 1;
  if (tags.has('cycle')) m *= 1.12;
  if (tags.has('tonicization')) m *= 0.75 + color / 125;
  if (tags.has('diminished')) m *= 0.65 + color / 110;
  if (tags.has('backdoor') || tags.has('modal')) m *= 0.45 + color / 95;
  if (tags.has('altered')) m *= 0.55 + color / 85;
  if (tags.has('tritone')) m *= 0.20 + color / 80;
  return m;
}

function choosePhrase(params: Params, role: SectionRole, salt: number, blocked = new Set<string>(), slot?: PhraseSlot): PhraseTemplate {
  const candidates = PHRASES.filter(p =>
    p.roles?.includes(role) &&
    (slot === undefined || p.slot === slot) &&
    (p.minColor === undefined || params.color >= p.minColor) &&
    (p.maxColor === undefined || params.color <= p.maxColor) &&
    !blocked.has(p.id)
  );
  const weighted = candidates.map(item => ({
    item,
    weight: item.baseWeight * (params.preset === 'bebop' ? (item.bebop ?? 1) : (item.classic ?? 1)) * chromaticMultiplier(item, params.color),
  })).filter(x => x.weight > 0);
  return weightedPick(weighted, params.seed, salt);
}

function canonicalPlan(params: Params, chorus: number): ChorusPlan {
  const source = CANONICAL[params.type][params.preset];
  const centers: TonalCenterPlan[] = FORM[params.type].map(section => ({
    chorus,
    section: section.name,
    centers: section.role === 'rhythm-bridge' ? ['III','VI','II','V'] : section.role.startsWith('blues') ? ['I','IV','I'] : [params.type === 'iimino' ? 'i' : 'I'],
    mode: section.mode,
    intent: section.intent,
  }));
  const phrases: PhraseTrace[] = [];
  let cursor = 0;
  for (const section of FORM[params.type]) {
    phrases.push({chorus,section:section.name,startBar:cursor,endBar:cursor+section.bars-1,family:'canonical',target:params.type==='iimino'?'i':'I',templateId:`canonical-${section.role}`});
    cursor += section.bars;
  }
  return {bars:[...source.bars],sections:[...source.sections],summary:source.name,centers,phrases};
}

function buildSinglePhraseForm(params: Params, chorus: number, role: 'cadence-major'|'cadence-minor'): ChorusPlan {
  const phrase = choosePhrase(params, role, 100 + chorus * 17, new Set(), 'whole');
  const section = FORM[params.type][0];
  return {
    bars:[...phrase.bars],
    sections:Array(section.bars).fill(section.name),
    summary:phrase.family,
    centers:[{chorus,section:section.name,centers:phrase.centers,mode:section.mode,intent:section.intent}],
    phrases:[{chorus,section:section.name,startBar:0,endBar:phrase.bars.length-1,family:phrase.family,target:phrase.target,templateId:phrase.id}],
  };
}

function buildBlues(params: Params, chorus: number, previousSummary?: string): ChorusPlan {
  const roles: SectionRole[] = ['blues-opening','blues-middle','blues-turnaround'];
  const picked: PhraseTemplate[] = [];
  const blocked = new Set<string>();
  roles.forEach((role,i)=>{
    let phrase = choosePhrase(params, role, 220 + chorus*31 + i*7, blocked, 'whole');
    if (previousSummary && i===0 && previousSummary.includes(phrase.family)) {
      blocked.add(phrase.id);
      phrase = choosePhrase(params, role, 260 + chorus*37 + i*11, blocked, 'whole');
    }
    picked.push(phrase);
  });

  const bars = picked.flatMap(p=>p.bars);
  const sections = [...Array(4).fill('A1'),...Array(4).fill('A2'),...Array(4).fill('A3')];
  const centers: TonalCenterPlan[] = [];
  const phrases: PhraseTrace[] = [];
  let cursor = 0;
  picked.forEach((phrase,i)=>{
    const spec = FORM.blues[i];
    centers.push({chorus,section:spec.name,centers:phrase.centers,mode:spec.mode,intent:spec.intent});
    phrases.push({chorus,section:spec.name,startBar:cursor,endBar:cursor+phrase.bars.length-1,family:phrase.family,target:phrase.target,templateId:phrase.id});
    cursor += phrase.bars.length;
  });
  return {bars,sections,summary:picked.map(p=>p.family).join(' → '),centers,phrases};
}

function rebuildRhythmA(plan: RhythmAPlan): RhythmAPlan {
  return {
    ...plan,
    bars:[...plan.opener.bars,...plan.closer.bars],
    centers:[...plan.opener.centers,...plan.closer.centers],
    traces:[
      {family:plan.opener.family,target:plan.opener.target,id:plan.opener.id,len:plan.opener.bars.length},
      {family:plan.closer.family,target:plan.closer.target,id:plan.closer.id,len:plan.closer.bars.length},
    ],
    pair:`${plan.opener.id}+${plan.closer.id}`,
  };
}

function buildRhythmA(params: Params, chorus: number, role: 'rhythm-a1'|'rhythm-a2'|'rhythm-a3', usedPairs: Set<string>, salt: number): RhythmAPlan {
  const opener = choosePhrase(params, role, salt, new Set(), 'a-open');
  const blockedClosers = new Set<string>();
  let closer = choosePhrase(params, role, salt + 13, blockedClosers, 'a-close');
  let pair = `${opener.id}+${closer.id}`;
  if (usedPairs.has(pair)) {
    blockedClosers.add(closer.id);
    closer = choosePhrase(params, role, salt + 29, blockedClosers, 'a-close');
    pair = `${opener.id}+${closer.id}`;
  }
  usedPairs.add(pair);
  return rebuildRhythmA({opener,closer,bars:[],centers:[],traces:[],pair});
}

function buildRhythm(params: Params, chorus: number, previousSummary?: string): ChorusPlan {
  const usedPairs = new Set<string>();
  const a1 = buildRhythmA(params,chorus,'rhythm-a1',usedPairs,400+chorus*53);
  const a2 = buildRhythmA(params,chorus,'rhythm-a2',usedPairs,500+chorus*59);
  const bridgeBlocked = new Set<string>();
  let bridge = choosePhrase(params,'rhythm-bridge',620+chorus*61,bridgeBlocked,'whole');
  if (previousSummary?.includes(bridge.family)) {
    bridgeBlocked.add(bridge.id);
    bridge = choosePhrase(params,'rhythm-bridge',680+chorus*67,bridgeBlocked,'whole');
  }
  let a3 = buildRhythmA(params,chorus,'rhythm-a3',usedPairs,760+chorus*71);

  // A3 should sound like a return, not a new unrelated section. At normal color it reuses
  // A1's opening phrase but keeps an independently generated closing cadence.
  if (params.color < 74) {
    a3 = rebuildRhythmA({...a3,opener:a1.opener});
  }

  const bars = [...a1.bars,...a2.bars,...bridge.bars,...a3.bars];
  const sections = [...Array(8).fill('A1'),...Array(8).fill('A2'),...Array(8).fill('B'),...Array(8).fill('A3')];
  const centers: TonalCenterPlan[] = [
    {chorus,section:'A1',centers:a1.centers,mode:'major',intent:FORM.rhythm[0].intent},
    {chorus,section:'A2',centers:a2.centers,mode:'major',intent:FORM.rhythm[1].intent},
    {chorus,section:'B',centers:bridge.centers,mode:'dominant',intent:FORM.rhythm[2].intent},
    {chorus,section:'A3',centers:a3.centers,mode:'major',intent:FORM.rhythm[3].intent},
  ];

  const phrases: PhraseTrace[] = [];
  const pushATraces = (section:string, base:number, traces:RhythmAPlan['traces']) => {
    let local=0;
    traces.forEach(t=>{
      phrases.push({chorus,section,startBar:base+local,endBar:base+local+t.len-1,family:t.family,target:t.target,templateId:t.id});
      local+=t.len;
    });
  };
  pushATraces('A1',0,a1.traces);
  pushATraces('A2',8,a2.traces);
  phrases.push({chorus,section:'B',startBar:16,endBar:23,family:bridge.family,target:bridge.target,templateId:bridge.id});
  pushATraces('A3',24,a3.traces);

  return {
    bars,
    sections,
    summary:`A1 ${a1.opener.family} · A2 ${a2.opener.family} · B ${bridge.family} · A3 return`,
    centers,
    phrases,
  };
}

export function buildChorusPlan(params: Params, chorus: number, previousSummary?: string): ChorusPlan {
  // Exact source-of-truth forms remain available at the bottom of the Color range. Above
  // that threshold, harmonic structure is generated independently of voicing complexity.
  if (params.color <= 8) return canonicalPlan(params,chorus);
  if (params.type === 'iivi') return buildSinglePhraseForm(params,chorus,'cadence-major');
  if (params.type === 'iimino') return buildSinglePhraseForm(params,chorus,'cadence-minor');
  if (params.type === 'blues') return buildBlues(params,chorus,previousSummary);
  return buildRhythm(params,chorus,previousSummary);
}

export function formLength(type: Params['type']): number {
  return FORM[type].reduce((sum,s)=>sum+s.bars,0);
}

export function sectionPlan(type: Params['type']): readonly SectionPlan[] {
  return FORM[type];
}
