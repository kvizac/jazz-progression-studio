# Jazz Progression Studio 6 — Producer Edition

Browser-based jazz / neo-soul composition workspace, rebuilt around editable musical phrases and a shared playback/MIDI performance.

## Use

Choose a key, tonality and language. Generate a 4, 8, 16 or 32-bar phrase, AABA, jazz blues or rhythm changes. Select any chord to audition, change root/quality/slash bass, edit individual MIDI pitches, invert, transpose an octave, or split its duration. Lock an edited chord to preserve its entire bar during regeneration. Undo/redo restores the project, including harmony and performance settings.

Select a bar range for playback and export. Choose sampled grand piano or a synthesized alternative, groove, swing, voicing, humanization, chord roll and optional root/walking bass. Playback loops with optional click/count-in. MIDI exports either that exact performance or on-grid block chords. Tracks are separate, notes begin relative to the selected range, tempo and 4/4 are embedded, chord markers are included, and every end-of-track event is padded to the exact range boundary. Metronome/count-in are monitoring aids and are not exported. Import MIDI into Ableton or another DAW and assign instruments there; MIDI contains notes, not the piano audio.

The session autosaves in this browser. Save/Open uses portable, validated v6 JSON projects. Save chart PNG exports the complete form.

## Musical implementation

`src/studio.ts` implements original paired phrase recipes, structural responses and contrasting bridge destinations, limited context-dependent dominant substitutions, major/minor-specific routes, and dynamic-programming voicing selection with a loop-seam cost. Triads, sevenths and extended qualities each contain their actual pitch classes. Rootless shapes omit the root. This is a transparent rule-based musical tool, not an AI model, a trained corpus system or a reproduction of copyrighted song charts. There is a finite recipe vocabulary; generation is not unlimited original composition. Individual note edits intentionally retain the chord label as a harmonic reference.

`performance()` creates deterministic note events once. `studioAudio.ts` and `studioMidi.ts` consume those events. The MIDI writer explicitly patches the end-of-track delta because @tonejs/midi 2.0.28 ignores endOfTrackTicks during encoding. Legacy modules and tests remain for regression history; the new app uses the studio modules.

## Sources and audio credits

- Jazz rootless voicing principles: https://www.thejazzpianosite.com/jazz-piano-lessons/jazz-chord-voicings/rootless-voicings/
- Harmonic phrase organization: https://openmusictheory.github.io/harmonicSyntax1.html
- Voicing vocabulary: https://pianowithjonny.com/piano-lessons/jazz-piano-chord-voicings-the-complete-guide/
- Tone Sampler API: https://tonejs.github.io/docs/15.1.22/classes/Sampler.html
- Salamander Grand Piano by Alexander Holm: https://github.com/sfzinstruments/SalamanderGrandPiano
- Piano samples licensed CC BY 3.0: https://creativecommons.org/licenses/by/3.0/
- Bundled MP3 subset obtained unmodified from https://tonejs.github.io/audio/salamander/ . This is a compact sample subset, not the full multi-velocity library. Synth alternatives work without sample loading.

## Development and checks

Node 22, `npm ci`, `npm test`, `npm run build`. Existing GitHub Pages workflow deploys main. The v6 tests cover all 12 keys, five languages, two modes and four forms; voicing pitch classes; locked edits; transposition; malformed projects; timing boundaries; and decoded MIDI equality against the source performance for all five grooves and three bass modes. A successful test run does not substitute for subjective listening or a real DAW import audition.
