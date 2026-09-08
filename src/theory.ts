import type { ChordQuality, Complexity, KeyName, ParsedChord } from './types';

export const PC: Record<string, number> = {
  C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, Fb:4, 'E#':5, F:5,
  'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11, Cb:11,
};

const FLAT_KEYS = new Set<KeyName>(['F','Bb','Eb','Ab','Db','Gb']);
const SHARP_SPELLINGS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT_SPELLINGS  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

const MAJOR_DEGREES: Record<string, number> = {
  I:0,i:0, II:2,ii:2, III:4,iii:4, IV:5,iv:5, V:7,v:7, VI:9,vi:9, VII:11,vii:11,
};
const MINOR_DEGREES: Record<string, number> = {
  I:0,i:0, II:2,ii:2, III:3,iii:3, IV:5,iv:5, V:7,v:7, VI:8,vi:8, VII:10,vii:10,
};

export function spellPc(pc: number, key: KeyName, preference?: 'flat'|'sharp'): string {
  const useFlats = preference === 'flat' || (preference !== 'sharp' && FLAT_KEYS.has(key));
  const table = useFlats ? FLAT_SPELLINGS : SHARP_SPELLINGS;
  return table[((pc % 12) + 12) % 12];
}

function accidentalShift(acc: string): number {
  if (acc === '#') return 1;
  if (acc === '##') return 2;
  if (acc === 'b') return -1;
  if (acc === 'bb') return -2;
  return 0;
}

export function degreeToPc(degree: string, key: KeyName, mode: 'major'|'minor'): number {
  const m = degree.match(/^(bb|##|b|#)?([ivIV]{1,4})$/);
  if (!m) throw new Error(`Invalid roman degree: ${degree}`);
  const acc = m[1] ?? '';
  const roman = m[2];
  const table = mode === 'major' ? MAJOR_DEGREES : MINOR_DEGREES;
  const rel = table[roman];
  if (rel === undefined) throw new Error(`Unsupported roman degree: ${roman}`);
  return (PC[key] + rel + accidentalShift(acc) + 120) % 12;
}

function defaultQuality(roman: string, mode: 'major'|'minor'): ChordQuality {
  if (mode === 'major') {
    if (roman === 'I') return 'maj7';
    if (roman === 'ii' || roman === 'iii' || roman === 'vi') return 'min7';
    if (roman === 'IV') return 'maj7';
    if (roman === 'V') return 'dom7';
    if (roman === 'vii') return 'halfDim7';
    if (/^[IV]+$/.test(roman)) return 'dom7';
    return 'min7';
  }
  if (roman === 'i') return 'minMaj7';
  if (roman === 'ii') return 'halfDim7';
  if (roman === 'III' || roman === 'VI') return 'maj7';
  if (roman === 'iv') return 'min7';
  if (roman === 'V' || roman === 'VII') return 'dom7';
  return /^[IV]+$/.test(roman) ? 'dom7' : 'min7';
}

function qualityFromSuffix(suffix: string, roman: string, mode: 'major'|'minor'): ChordQuality {
  const s = suffix
    .replaceAll('♭','b')
    .replaceAll('♯','#')
    .replaceAll('∆','Δ')
    .trim();

  if (s === 'Δ9#11' || s === '^9#11') return 'maj9#11';
  if (s === 'Δ9' || s === '^9') return 'maj9';
  if (s === 'Δ7' || s === '^7' || s === '^') return 'maj7';
  if (s === 'Δ6' || s === '6') return 'maj6';
  if (s === '6/9') return 'maj69';
  if (s === '-Δ' || s === 'mΔ' || s === 'mMaj7') return 'minMaj7';
  if (s === '-6/9' || s === 'm6/9') return 'min69';
  if (s === '-9' || s === 'm9') return 'min9';
  if (s === '-7' || s === 'm7') return 'min7';
  if (s === 'ø7' || s === 'm7b5') return 'halfDim7';
  if (s === 'ø') return 'halfDimTriad';
  if (s === '°7' || s === 'dim7') return 'dim7';
  if (s === '°' || s === 'dim') return 'dimTriad';
  if (s === '7alt' || s === 'alt') return 'dom7alt';
  if (s === '7b9') return 'dom7b9';
  if (s === '7#9') return 'dom7#9';
  if (s === '7#11') return 'dom7#11';
  if (s === '7sus' || s === '7sus4') return 'dom7sus';
  if (s === '13') return 'dom13';
  if (s === '9') return /^[iv]+$/.test(roman) ? 'min9' : 'dom9';
  if (s === '7') return /^[iv]+$/.test(roman) ? 'min7' : 'dom7';
  if (s === 'm') return 'min';
  if (s === '') return defaultQuality(roman, mode);
  throw new Error(`Unsupported chord suffix "${suffix}" in ${roman}${suffix}`);
}

function simplifyQuality(q: ChordQuality, complexity: Complexity): ChordQuality {
  if (complexity === 'extended') return q;
  if (complexity === 'sevenths') {
    if (q === 'maj6') return 'maj6';
    if (q === 'maj' || q === 'maj9' || q === 'maj9#11' || q === 'maj69') return 'maj7';
    if (q === 'min' || q === 'min9' || q === 'min69') return 'min7';
    if (q === 'domTriad' || q === 'dom9' || q === 'dom13' || q === 'dom7b9' || q === 'dom7#9' || q === 'dom7#11' || q === 'dom7alt' || q === 'dom7sus') return 'dom7';
    if (q === 'halfDimTriad') return 'halfDim7';
    if (q === 'dimTriad') return 'dim7';
    return q;
  }
  // Triads: preserve diminished/half-diminished identity in the symbol, otherwise reduce to 1-3-5.
  if (q === 'halfDim7' || q === 'halfDimTriad') return 'halfDimTriad';
  if (q === 'dim7' || q === 'dimTriad') return 'dimTriad';
  if (q === 'min7' || q === 'min9' || q === 'minMaj7' || q === 'min69' || q === 'min') return 'min';
  if (q.startsWith('dom')) return 'domTriad';
  return 'maj';
}

export function qualitySuffix(q: ChordQuality): string {
  const symbols: Record<ChordQuality,string> = {
    maj:'', min:'m', domTriad:'', halfDimTriad:'ø', dimTriad:'°',
    maj7:'Δ7', maj6:'Δ6', maj9:'Δ9', 'maj9#11':'Δ9♯11', maj69:'6/9',
    min7:'m7', min9:'m9', minMaj7:'-Δ', min69:'-6/9',
    dom7:'7', dom9:'9', dom13:'13', dom7b9:'7♭9', 'dom7#9':'7♯9', 'dom7#11':'7♯11', dom7alt:'7alt', dom7sus:'7sus4',
    halfDim7:'ø7', dim7:'°7',
  };
  return symbols[q];
}

/**
 * Parse tokens used by the engine:
 * IΔ7, ii7, #iv°7, bVII13, V7/ii, V7b9/vi, ii7/IV, iiø7/vi, subV/I.
 */
export function parseRomanToken(token: string, key: KeyName, mode: 'major'|'minor', complexity: Complexity): ParsedChord {
  const raw = token.trim();
  if (!raw) throw new Error('Empty chord token');

  // Tritone dominant of a target. Example: subV/I -> Db7 in C.
  const sub = raw.match(/^subV(?:7)?(?:#11|♯11)?\/((?:bb|##|b|#)?[ivIV]{1,4})$/);
  if (sub) {
    const targetPc = degreeToPc(sub[1], key, mode);
    const dominantPc = (targetPc + 7) % 12;
    const rootPc = (dominantPc + 6) % 12;
    const baseQ: ChordQuality = raw.includes('#11') || raw.includes('♯11') ? 'dom7#11' : 'dom7';
    const quality = simplifyQuality(baseQ, complexity);
    const rootName = spellPc(rootPc, key, 'flat');
    return { token: raw, roman: `subV/${sub[1]}`, rootPc, rootName, quality, symbol: rootName + qualitySuffix(quality) };
  }

  // Tonicization: ii/V, V/ii, etc. We explicitly support ii, II and V as the source function.
  const rel = raw.match(/^((?:bb|##|b|#)?(?:ii|II|V))(ø7|m7b5|m7|-7|7alt|7b9|7#9|7#11|13|9|7)?\/((?:bb|##|b|#)?[ivIV]{1,4})$/);
  if (rel) {
    const source = rel[1];
    const suffix = rel[2] ?? '';
    const target = rel[3];
    const targetPc = degreeToPc(target, key, mode);
    const sourceRoman = source.replace(/^(bb|##|b|#)/,'');
    const sourceAcc = source.slice(0, source.length - sourceRoman.length);
    const sourceOffset = sourceRoman.toLowerCase() === 'ii' ? 2 : 7;
    const rootPc = (targetPc + sourceOffset + accidentalShift(sourceAcc) + 120) % 12;
    const inferredSuffix = suffix || (sourceRoman.toLowerCase() === 'ii' ? 'm7' : '7');
    const baseQ = qualityFromSuffix(inferredSuffix, sourceRoman === 'ii' ? 'ii' : 'V', mode);
    const quality = simplifyQuality(baseQ, complexity);
    const rootName = spellPc(rootPc, key);
    return { token: raw, roman: `${source}/${target}`, rootPc, rootName, quality, symbol: rootName + qualitySuffix(quality) };
  }

  // Protect 6/9 from being mistaken for a secondary function slash.
  const plain = raw.match(/^((?:bb|##|b|#)?[ivIV]{1,4})(.*)$/);
  if (!plain) throw new Error(`Cannot parse roman token: ${raw}`);
  const romanDegree = plain[1];
  const suffix = plain[2] ?? '';
  const bareRoman = romanDegree.replace(/^(bb|##|b|#)/,'');
  const rootPc = degreeToPc(romanDegree, key, mode);
  const baseQ = qualityFromSuffix(suffix, bareRoman, mode);
  const quality = simplifyQuality(baseQ, complexity);
  const preference = romanDegree.startsWith('b') ? 'flat' : romanDegree.startsWith('#') ? 'sharp' : undefined;
  const rootName = spellPc(rootPc, key, preference);
  return { token: raw, roman: romanDegree, rootPc, rootName, quality, symbol: rootName + qualitySuffix(quality) };
}

export function isDominantQuality(q: ChordQuality): boolean {
  return q === 'domTriad' || q.startsWith('dom');
}

export function isMajorQuality(q: ChordQuality): boolean {
  return q === 'maj' || q.startsWith('maj');
}

export function isMinorQuality(q: ChordQuality): boolean {
  return q === 'min' || q.startsWith('min');
}
