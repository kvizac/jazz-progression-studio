# Jazz Progression Studio

A client-only React/TypeScript jazz harmony generator with lead-sheet canvas rendering, Tone.js playback, and Standard MIDI export for DAWs such as Ableton Live 12.

## What is different about this version

The generator does **not** randomly replace isolated chords. It chooses coherent whole-form harmonic variants and then parses/voices them functionally. Extended mode can use secondary dominants, ii–V tonicizations, passing diminished chords, altered dominants and tritone substitutions. Consecutive extended choruses avoid selecting the same form variant twice.

Playback voicings follow the guide-tone priorities described by JB Dyas: 3rds and 7ths define the harmony, major/dominant avoid-tone handling is respected, half-diminished and altered-dominant shapes use appropriate chord tones, and voicing candidates are scored for minimal movement from one chord to the next.

## Features

- Keys: C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B
- Major ii–V–I, minor iiø–V–i, 12-bar Jazz Blues, 32-bar Rhythm Changes
- Classic and Bebop/Parker presets
- Triads, 7ths, Extended harmony
- Harmonic Color control for controlled reharmonization
- Whole-form variation generator with deterministic seed
- Correct flat spellings plus function-aware `bVII` / tritone-sub spelling
- Responsive HTML canvas lead-sheet chart with active playback bar
- Straight/swing playback, 60–66% swing control, sparse/bebop comping, optional strum
- Piano/Guitar/Bass voicing ranges
- Standard MIDI export using `@tonejs/midi`
- PNG chart export
- Status/logging UI
- Built-in acceptance test harness plus Vitest suite
- No backend

## Local development

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Verify

```bash
npm test
npm run build
```

The browser UI also includes an acceptance-harness panel.

## Static deployment

`npm run build` writes the production site to `dist/`. The Vite config uses `base: './'`, so the build is portable to a Vercel/Netlify static deployment or a GitHub Pages project path.

### GitHub Pages

A GitHub Actions workflow is included at `.github/workflows/deploy.yml`. In the repository, enable **Settings → Pages → Source: GitHub Actions**.

## Musical grounding

The implementation uses the uploaded JB Dyas voicing reference for guide-tone priorities and altered/half-diminished voicing shapes, and the uploaded standards-progression material as a model for functional tonicization, dominant chains, modal interchange and tritone-sub movement. The supplied requirements remain the acceptance-test source of truth.
