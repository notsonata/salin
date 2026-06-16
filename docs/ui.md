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
- no decorative gradients, no floating dashboard shells
- `/` is a dedicated product home that explains the workflow and routes users into the dashboard or preview workspace

The transcript is the primary artifact. Notes and future controls must stay visually secondary.

For the current workspace UI, "secondary" means transcript-first in content priority, not hidden in the layout. Notes generation must remain immediately discoverable, with a dedicated visible destination for generated sections.

## Color Palette

Use color as product meaning, not decoration:

- warm neutral canvas, panel, field, line, ink, and muted remain the base for readability
- brand deep green anchors the dedicated home intro
- teal/accent marks upload, correction, and primary submit actions
- blue/review marks transcript review, timestamp seeking, search, and transcript exports
- plum/notes marks notes generation, notes editing, and combined notes exports
- amber/attention marks queued, generating, processing, and PDF/export attention states
- coral/danger marks backend, upload, notes, and processing failures
- green/success marks completed or saved states

Most color should appear as soft fills, borders, icons, badges, and active states. Avoid large saturated blocks except for the home intro and primary action buttons.

## Current Screens

### Home

Route: `/`

Required elements:

- clear product framing for uploaded recording review
- no live meeting or realtime transcription language
- visual transcript/workspace preview
- concise workflow explanation
- primary route into `/dashboard`
- secondary route into `/preview/recording` for frontend-only review

### Dashboard

Route: `/dashboard`

Required elements:

- `New recording` composer as the first visual priority
- file picker
- supported format hint
- language selector
- processing mode selector
- speaker count selector
- start-processing action
- `Recent recordings` compact table beneath the composer

Dashboard table requirements:

- columns for filename, status, language, updated time, and open action
- clear empty state when no recordings exist yet
- obvious reopen path back into any existing recording detail page
- when the backend is offline during local UI review, show a calm backend-off state with a link to the preview workspace

### Recording detail workspace

Route: `/recordings/[id]`

Current layout:

- top detail header with filename, transcript state, compact metadata, and `Back to dashboard`
- tab switcher with `Transcript` and `Notes`
- transcript tab for processing, playback, search, export, and transcript review
- notes tab for generation, editing, and save actions
- non-fatal processing notes for local-backup fallback or speaker-estimation failure

Current export controls:

- transcript tab shows backend-backed `Transcript TXT` and `Transcript PDF` links inside a grouped export toolbar once transcript blocks are available
- notes tab shows backend-backed `Notes TXT`, `Notes PDF`, `Combined TXT`, and `Combined PDF` links inside a grouped export toolbar once notes are completed

Current transcript block contents:

- clickable timestamp
- estimated or edited speaker label badge
- per-block speaker label edit control
- provider badge
- transcript text

Current transcript-level speaker controls:

- rename one speaker label across the recording
- merge duplicate speaker labels by renaming one label to an existing label

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

Current UI polish:

- home uses a modern product intro with deeper color and a transcript preview
- dashboard is separated into a compact upload and recent-recordings workspace
- recording detail uses a compact session strip, icon tabs, grouped export controls, and a timestamp-led transcript review surface
- notes use a structured document editing surface with visible status, dirty state, save, generate/regenerate, and export controls

### UI preview route

Route: `/preview/recording`

Purpose:

- frontend-only recording workspace preview when the backend is not running
- lets reviewers inspect transcript, notes, speaker editing, search, timestamp controls, and exports without provider calls
- must remain framed as a local UI review aid, not a production workflow

## State Design

Every major screen should cover:

- empty file selection
- active upload submission
- processing poll state
- transcript-ready while speaker estimation is still running
- completed transcript state
- retryable failure state
- non-retryable load failure state

## Accessibility Expectations

- file input, selects, and submit button must have explicit labels
- status copy must be understandable without relying on color alone
- retry must be keyboard reachable
- transcript timestamps must stay readable and structured even before they become interactive

## Next UI Milestones

Current planning artifact:

- `docs/superpowers/plans/2026-06-16-ui-ux-revamp.md`

Later milestones should add, in order:

1. user-guided full UI review against real recordings
2. finer responsive polish after testing on the presentation Mac
3. deeper visual treatment for long-recording progress once real chunk telemetry is reviewed
