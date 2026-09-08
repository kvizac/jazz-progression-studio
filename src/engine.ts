import type { GeneratedChart, Params, RenderedBar } from './types';
import { buildChorusPlan, formLength } from './harmonyModel';
import { buildStandardChorusPlan, STANDARD_FORM_LENGTH } from './standardModel';
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
 * Corpus Form Engine pipeline:
 * 1. choose whole form (legacy form or 32-bar AABA/ABAC standard)
 * 2. plan section-level tonal destinations
 * 3. choose phrase families conditioned on section role and harmonic color
 * 4. realize weighted corpus-informed Roman-function paths
 * 5. parse/spell chords in the concert key
 * 6. hand the chart to the existing guide-tone voice-leading layer
 */
export function buildChart(params: Params): GeneratedChart {
  validate(params);

  const mode = params.type === 'iimino' && !params.standardForm ? 'minor' : 'major';
  const bars: RenderedBar[] = [];
  const variantNames: string[] = [];
  const tonalCenters: NonNullable<GeneratedChart['tonalCenters']> = [];
  const phrases: NonNullable<GeneratedChart['phrases']> = [];
  let previousSummary: string | undefined;

  for (let chorus = 0; chorus < params.choruses; chorus++) {
    const plan = params.standardForm
      ? buildStandardChorusPlan(params, chorus, previousSummary)
      : buildChorusPlan(params, chorus, previousSummary);
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
    formLength: params.standardForm ? STANDARD_FORM_LENGTH : formLength(params.type),
    variantNames,
    tonalCenters,
    phrases,
  };
}

export function formName(type: Params['type'], standardForm = false): string {
  if (standardForm) return '32-Bar Jazz Standard';
  return type === 'iivi'
    ? 'ii–V–I Major'
    : type === 'iimino'
      ? 'iiø–V–i Minor'
      : type === 'blues'
        ? '12-Bar Jazz Blues'
        : 'Rhythm Changes';
}
