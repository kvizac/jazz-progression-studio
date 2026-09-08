import type { GeneratedChart, Params, RenderedBar } from './types';
import { parseRomanToken } from './theory';

type Variant = { name: string; bars: string[]; sections?: string[] };

const BASE_VARIANTS: Record<Params['type'], Record<Params['preset'], Variant>> = {
  iivi: {
    classic: { name:'Canonical ii–V–I', bars:['ii7','V7','IΔ7','IΔ7'] },
    bebop: { name:'Bebop ii–V–I', bars:['ii7','V7','IΔ7','IΔ7'] },
  },
  iimino: {
    classic: { name:'Canonical minor cadence', bars:['iiø7','V7alt','i-Δ','i-Δ'] },
    bebop: { name:'Bebop minor cadence', bars:['iiø7','V7alt','i-Δ','i-Δ'] },
  },
  blues: {
    classic: {
      name:'Classic jazz blues',
      bars:['I7','IV7','I7','I7','IV7','#iv°7','I7','VI7','ii7','V7','I7','V7'],
    },
    bebop: {
      name:'Bebop blues',
      bars:['I7','IV7','I7','VI7','ii7','V7','I7','VI7','ii7','V7','I7,VI7','ii7,V7'],
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

const EXTENDED_VARIANTS: Record<Params['type'], Variant[]> = {
  iivi: [
    { name:'Dyas colors', bars:['ii9','V13','IΔ9#11','I6/9'] },
    { name:'Altered cadence', bars:['ii9','V7alt','IΔ9','I6/9'] },
    { name:'Tritone cadence', bars:['ii9','subV#11/I','IΔ9','I6/9'] },
    { name:'Turnaround chain', bars:['iii7,VI7alt','ii9,V13','IΔ9#11','I6/9'] },
  ],
  iimino: [
    { name:'Minor altered', bars:['iiø7','V7alt','i-Δ','i-6/9'] },
    { name:'Minor b9', bars:['iiø7','V7b9','i-Δ','i-6/9'] },
    { name:'Minor tritone color', bars:['iiø7','subV/i','i-Δ','i-6/9'] },
    { name:'Minor turnaround', bars:['iiø7','V7alt','i-Δ,VI7alt','iiø7,V7alt'] },
  ],
  blues: [
    {
      name:'Modern jazz blues',
      bars:[
        'I13','IV9','I13','ii7/IV,V7/IV',
        'IV9','#iv°7','I13,VI7alt','ii9,V13',
        'iii7,VI7alt','ii9,V13','I6/9,VI7alt','ii9,V7alt',
      ],
    },
    {
      name:'Parker chain blues',
      bars:[
        'I7','iiø7/vi,V7b9/vi','ii7/V,V7/V','ii7/IV,V7/IV',
        'IV9','#iv°7','I13,VI7alt','ii9,V13',
        'iii7,VI7alt','ii9,V7alt','I6/9,VI7alt','ii9,V7alt',
      ],
    },
    {
      name:'Tritone turnaround blues',
      bars:[
        'I13','IV9','I13','ii7/IV,V7b9/IV',
        'IV9','#iv°7','I13,VI7alt','ii9,subV/I',
        'iii7,VI7alt','ii9,subV/I','I6/9,VI7alt','ii9,subV/I',
      ],
    },
    {
      name:'Bebop blues',
      bars:[
        'I7','IV7','I7','VI7',
        'ii7','V7','I7','VI7',
        'ii7','V7','I7,VI7','ii7,V7',
      ],
    },
  ],
  rhythm: [
    {
      name:'Parker rhythm changes',
      bars:[
        'I6,VI7','ii7,V7','iii7,VI7','ii7,V7','I6,I7','IVΔ7,#iv°7','I6,VI7alt','ii9,V13',
        'I6,VI7','ii7,V7','iii7,VI7alt','ii9,V13','I6,I7','IVΔ7,#iv°7','I6,VI7alt','ii9,V7alt',
        'III7','VI7','II7','V7','ii7/VI,V7/VI','ii7/II,V7/II','ii7/V,V7/V','ii7/I,V7/I',
        'I6,VI7','ii7,V7','iii7,VI7alt','ii9,V13','I6,I7','IVΔ7,#iv°7','I6,VI7alt','ii9,V7alt',
      ],
      sections:[...Array(8).fill('A1'),...Array(8).fill('A2'),...Array(8).fill('B'),...Array(8).fill('A3')],
    },
    {
      name:'Bebop bridge + tritone turnarounds',
      bars:[
        'I6,VI7alt','ii9,V13','iii7,VI7alt','ii9,subV/I','I6,I7','IVΔ9,#iv°7','I6,VI7alt','ii9,V7alt',
        'I6,VI7alt','ii9,V13','iii7,VI7alt','ii9,subV/I','I6,I7','IVΔ9,#iv°7','I6,VI7alt','ii9,V7alt',
        'ii7/VI,V7/VI','ii7/II,V7/II','ii7/V,V7/V','ii7/I,V7/I','III7','VI7','II7','V7',
        'I6,VI7alt','ii9,V13','iii7,VI7alt','ii9,subV/I','I6,I7','IVΔ9,#iv°7','I6,VI7alt','ii9,V7alt',
      ],
      sections:[...Array(8).fill('A1'),...Array(8).fill('A2'),...Array(8).fill('B'),...Array(8).fill('A3')],
    },
    {
      name:'Modern rhythm changes',
      bars:[
        'IΔ9,VI7alt','ii9,V13','iii7,VI7alt','ii9,V7alt','I6,I7','IVΔ9,#iv°7','I6,VI7alt','ii9,subV/I',
        'IΔ9,VI7alt','ii9,V13','iii7,VI7alt','ii9,V7alt','I6,I7','IVΔ9,#iv°7','I6,VI7alt','ii9,V7alt',
        'III7','VI7','II7','V7','III7','VI7','II7','V7',
        'IΔ9,VI7alt','ii9,V13','iii7,VI7alt','ii9,V7alt','I6,I7','IVΔ9,#iv°7','I6,VI7alt','ii9,V7alt',
      ],
      sections:[...Array(8).fill('A1'),...Array(8).fill('A2'),...Array(8).fill('B'),...Array(8).fill('A3')],
    },
  ],
};

function hashSeed(seed: number, salt: number): number {
  let x = (seed ^ (salt * 0x9e3779b9)) >>> 0;
  x ^= x << 13; x >>>= 0;
  x ^= x >>> 17; x >>>= 0;
  x ^= x << 5; x >>>= 0;
  return x >>> 0;
}

function chooseIndex(seed: number, count: number): number {
  return count <= 1 ? 0 : seed % count;
}

function chooseVariant(params: Params, chorus: number, previous: number | null): { variant: Variant; index: number } {
  const canonical = BASE_VARIANTS[params.type][params.preset];
  let pool = EXTENDED_VARIANTS[params.type];
  if (params.type === 'blues' && params.preset === 'bebop') pool = pool.filter(v => v.name !== 'Bebop blues');
  if (params.type === 'blues' && params.preset === 'classic') pool = pool.filter(v => v.name !== 'Bebop blues' && v.name !== 'Parker chain blues');
  if (params.type === 'rhythm' && params.preset === 'classic') pool = pool.filter(v => v.name !== 'Parker rhythm changes');

  const useCanonical = params.color <= 5 || params.complexity !== 'extended';
  if (useCanonical) return { variant: canonical, index: -1 };

  const roll = hashSeed(params.seed, chorus + 101) % 100;
  const canonicalChance = params.preset === 'classic' ? Math.max(0, 55 - params.color / 2) : Math.max(0, 22 - params.color / 4);
  if (roll < canonicalChance) return { variant: canonical, index: -1 };

  let idx = chooseIndex(hashSeed(params.seed, chorus + 401), pool.length);
  if (pool.length > 1 && previous !== null && idx === previous) idx = (idx + 1) % pool.length;
  return { variant: pool[idx], index: idx };
}

export function buildChart(params: Params): GeneratedChart {
  if (!Number.isFinite(params.bpm) || params.bpm < 40 || params.bpm > 300) throw new Error('Tempo must be between 40 and 300 BPM.');
  if (!Number.isInteger(params.choruses) || params.choruses < 1 || params.choruses > 10) throw new Error('Choruses must be an integer from 1 to 10.');

  const mode = params.type === 'iimino' ? 'minor' : 'major';
  const result: RenderedBar[] = [];
  const variantNames: string[] = [];
  let previousVariant: number | null = null;

  for (let chorus = 0; chorus < params.choruses; chorus++) {
    const chosen = chooseVariant(params, chorus, previousVariant);
    previousVariant = chosen.index >= 0 ? chosen.index : previousVariant;
    const variant = chosen.variant;
    variantNames.push(variant.name);

    variant.bars.forEach((barToken, barInForm) => {
      const tokens = barToken.split(',').map(s => s.trim()).filter(Boolean);
      const durationBeats = 4 / tokens.length;
      const events = tokens.map((token, i) => ({
        token,
        chord: parseRomanToken(token, params.key, mode, params.complexity),
        startBeat: i * durationBeats,
        durationBeats,
      }));
      result.push({
        index: result.length,
        chorus,
        section: variant.sections?.[barInForm] ?? (params.type === 'blues' ? 'Blues' : params.type === 'rhythm' ? 'A' : 'Cadence'),
        events,
        label: events.map(e => e.chord.symbol).join('  |  '),
      });
    });
  }

  return { bars: result, formLength: BASE_VARIANTS[params.type][params.preset].bars.length, variantNames };
}

export function formName(type: Params['type']): string {
  return type === 'iivi' ? 'ii–V–I Major' : type === 'iimino' ? 'iiø–V–i Minor' : type === 'blues' ? '12-Bar Jazz Blues' : 'Rhythm Changes';
}
