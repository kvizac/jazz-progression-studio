import type { GeneratedChart, Params, RenderedBar } from './types';
import { buildChorusPlan, formLength } from './harmonyModel';
import { parseRomanToken } from './theory';

function validate(params: Params): void {
  if (!Number.isFinite(params.bpm) || params.bpm < 40 || params.bpm > 300) {
    throw new Error('Tempo must be between 40 and 300 BPM.');
  }
  if (!Number.isInteger(params.choruses) || params.choruses < 1 || params.choruses > 10) {
    throw new Error('Choruses must be an integer from 1 to 10.');
  }
  if (!Number.isFinite(params.color) || params.color < 0 || params.color > 100) {
    throw new Error('Harmonic color must be between 0 and 100.');
  }
}

/**
 * Structural generation pipeline:
 * 1. form / section plan
 * 2. tonal-center route
 * 3. phrase-grammar selection
 * 4. corpus-informed weighted realization
 * 5. roman-token parsing / enharmonic spelling
 *
 * Playback voicing happens later in voicings.ts, so harmonic structure and voicing
 * complexity are intentionally independent concerns.
 */
export function buildChart(params: Params): GeneratedChart {
  validate(params);

  const mode = params.type === 'iimino' ? 'minor' : 'major';
  const bars: RenderedBar[] = [];
  const variantNames: string[] = [];
  const tonalCenters: NonNullable<GeneratedChart['tonalCenters']> = [];
  const phrases: NonNullable<GeneratedChart['phrases']> = [];
  let previousSummary: string | undefined;

  for (let chorus = 0; chorus < params.choruses; chorus++) {
    const plan = buildChorusPlan(params, chorus, previousSummary);
    previousSummary = plan.summary;
    variantNames.push(plan.summary);
    tonalCenters.push(...plan.centers);

    const formStart = bars.length;
    for (const trace of plan.phrases) {
      phrases.push({
        ...trace,
        startBar: trace.startBar + formStart,
        endBar: trace.endBar + formStart,
      });
    }

    plan.bars.forEach((barToken, barInForm) => {
      const tokens = barToken.split(',').map(s => s.trim()).filter(Boolean);
      if (!tokens.length) throw new Error(`Generated an empty bar at ${barInForm + 1}.`);
      const durationBeats = 4 / tokens.length;
      const events = tokens.map((token, i) => ({
        token,
        chord: parseRomanToken(token, params.key, mode, params.complexity),
        startBeat: i * durationBeats,
        durationBeats,
      }));
      bars.push({
        index: bars.length,
        chorus,
        section: plan.sections[barInForm] ?? 'Form',
        events,
        label: events.map(e => e.chord.symbol).join('  |  '),
      });
    });
  }

  return {
    bars,
    formLength: formLength(params.type),
    variantNames,
    tonalCenters,
    phrases,
  };
}

export function formName(type: Params['type']): string {
  return type === 'iivi'
    ? 'ii–V–I Major'
    : type === 'iimino'
      ? 'iiø–V–i Minor'
      : type === 'blues'
        ? '12-Bar Jazz Blues'
        : 'Rhythm Changes';
}
