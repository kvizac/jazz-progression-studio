export type KeyName = 'C'|'Db'|'D'|'Eb'|'E'|'F'|'Gb'|'G'|'Ab'|'A'|'Bb'|'B';
export type ProgressionType = 'iivi'|'iimino'|'blues'|'rhythm';
export type Preset = 'classic'|'bebop'|'modern'|'neosoul'|'rnb';
export type Groove = 'straight'|'swing';
export type Instrument = 'piano'|'guitar'|'bass';
export type Complexity = 'triads'|'sevenths'|'extended';
export type CompingStyle = 'sustained'|'sparse'|'bebop';
export type TonalMode = 'major'|'minor'|'dominant';

export type Params = {
  key: KeyName;
  type: ProgressionType;
  /** When true, the engine generates a full corpus-informed 32-bar standard instead of a legacy form. */
  standardForm: boolean;
  preset: Preset;
  choruses: number;
  bpm: number;
  groove: Groove;
  swing: number; // 0.60–0.66 human-readable ratio
  strum: boolean;
  strumMs: number;
  instrument: Instrument;
  complexity: Complexity;
  color: number; // 0..100, harmonic distance / reharmonization amount
  comping: CompingStyle;
  metronome: boolean;
  /** Humanized microtiming, velocity, duration and dynamic strum. Defaults on when omitted. */
  humanize?: boolean;
  /** 0..100. Controls the magnitude of bounded performance variation. */
  humanizeAmount?: number;
  seed: number;
};

export type ChordQuality =
  | 'maj' | 'min' | 'domTriad' | 'halfDimTriad' | 'dimTriad'
  | 'maj7' | 'maj6' | 'maj9' | 'maj9#11' | 'maj69'
  | 'min7' | 'min9' | 'minMaj7' | 'min69'
  | 'dom7' | 'dom9' | 'dom13' | 'dom7b9' | 'dom7#9' | 'dom7#11' | 'dom7alt' | 'dom7sus'
  | 'halfDim7' | 'dim7';

export type ParsedChord = {
  token: string;
  roman: string;
  rootPc: number;
  rootName: string;
  quality: ChordQuality;
  symbol: string;
};

export type ChordEvent = {
  token: string;
  chord: ParsedChord;
  startBeat: number;
  durationBeats: number;
};

export type RenderedBar = {
  index: number;
  chorus: number;
  section: string;
  events: ChordEvent[];
  label: string;
};

export type TonalCenterPlan = {
  chorus: number;
  section: string;
  centers: string[];
  mode: TonalMode;
  intent: string;
};

export type PhraseTrace = {
  chorus: number;
  section: string;
  startBar: number;
  endBar: number;
  family: string;
  target: string;
  templateId: string;
};

export type GeneratedChart = {
  bars: RenderedBar[];
  formLength: number;
  variantNames: string[];
  tonalCenters?: TonalCenterPlan[];
  phrases?: PhraseTrace[];
};

export type VoicedEvent = ChordEvent & {
  midi: number[];
};

export type TestResult = {
  name: string;
  pass: boolean;
  detail?: string;
};
