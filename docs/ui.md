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

For the current workspace UI, "secondary" means transcript-first in content priority, not hidden in the layout. Notes generation must remain immediately discoverable, with a dedicated visible destination for generated sections.

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

- top summary band with filename, transcript state, and workspace guidance
- dedicated notes column that is visible before the transcript on mobile and sticky on desktop
- audio review card with normalized playback and source link
- transcript surface with search, TXT export, timestamp buttons, and active-segment highlighting
- compact recording metadata rail below the notes workspace

Current transcript block contents:

- clickable timestamp
- generic estimated speaker label
- provider badge
- transcript text

Current notes panel states:

- idle
- queued
- generating
- completed
- failed

Current notes panel requirements:

- a primary visible notes action without hunting through metadata cards
- a clear empty state that shows where generated notes will appear
- persistent section containers for summary, key points, decisions, action items, and questions

Still intentionally deferred:

- speaker editing controls
- notes TXT export
- PDF export
- combined export controls

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

1. estimated speaker correction workflows
2. notes and transcript export expansion
3. PDF and combined export controls
