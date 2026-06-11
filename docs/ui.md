# UI Conventions

## Product Framing

Salin is a post-recording review workspace for uploaded recordings.

Avoid language that implies:

- live meeting assistance
- perfect speaker identification
- perfect Taglish transcription
- legal-grade output

Required disclaimer:

`Speaker labels are automatically estimated and can be edited.`

## Current Visual Direction

Use a systematic repeated-use product UI:

- light warm-neutral surfaces
- compact header and dense content regions
- `Public Sans`-class sans for primary text
- mono metadata labels for small status information
- modest radii, clear borders, minimal shadows
- no hero composition, no decorative gradients, no floating dashboard shells

The transcript is the primary artifact. Notes and future controls must stay visually secondary.

## Current Screens

### Upload screen

Route: `/`

Required elements:

- file picker
- supported format hint
- language selector
- processing mode selector
- speaker count selector
- start-processing action
- concise quality notes in the side rail

### Transcript workspace

Route: `/recordings/[id]`

Current layout:

- top summary card with filename and job state
- main transcript column with timestamped blocks
- right rail with recording metadata, processing summary, and notes placeholder

Current transcript block contents:

- visible timestamp
- generic estimated speaker label
- provider badge
- transcript text

Phase 1 intentionally does **not** render:

- audio controls
- clickable timestamp seeking
- transcript search
- speaker editing controls
- notes generation controls
- export controls

## State Design

Every major screen should cover:

- empty file selection
- active upload submission
- processing poll state
- completed transcript state
- retryable failure state
- non-retryable load failure state

## Accessibility Expectations

- file input, selects, and submit button must have explicit labels
- status copy must be understandable without relying on color alone
- retry must be keyboard reachable
- transcript timestamps must stay readable and structured even before they become interactive

## Next UI Milestones

Later milestones should add, in order:

1. audio playback and timestamp seeking
2. transcript search
3. notes generation from stored transcript data
4. estimated speaker correction workflows
5. export controls
