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
- sans body copy with mono display headings
- mono metadata labels for small status information
- modest radii, clear borders, minimal shadows
- no hero composition, no decorative gradients, no floating dashboard shells

The transcript is the primary artifact. Notes and future controls must stay visually secondary.

For the current workspace UI, "secondary" means transcript-first in content priority, not hidden in the layout. Notes generation must remain immediately discoverable, with a dedicated visible destination for generated sections.

## Current Screens

### Dashboard

Route: `/`

Required elements:

- intro copy that frames `/` as the durable workspace home
- `New recording` composer as the first visual priority
- file picker
- supported format hint
- language selector
- processing mode selector
- speaker count selector
- start-processing action
- concise quality notes in the side rail
- `Recent recordings` compact table beneath the composer

Dashboard table requirements:

- columns for filename, status, language, updated time, and open action
- clear empty state when no recordings exist yet
- obvious reopen path back into any existing recording detail page

### Recording detail workspace

Route: `/recordings/[id]`

Current layout:

- top detail header with filename, transcript state, compact metadata, and `Back to dashboard`
- tab switcher with `Transcript` and `Notes`
- transcript tab for processing, playback, search, export, and transcript review
- notes tab for generation, editing, and save actions

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

Current notes tab requirements:

- a primary visible notes action without hunting through metadata cards
- a clear empty state that shows where generated notes will appear
- persistent section containers for summary, key points, decisions, action items, and questions
- structured editing with textarea summary plus editable lists for the remaining sections
- visible dirty state
- explicit `Save edits` action
- warning before destructive regenerate when unsaved edits exist
- browser unload warning while unsaved edits exist

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
