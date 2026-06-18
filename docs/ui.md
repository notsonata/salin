# UI Conventions

## Product framing

Salin is a post-recording review workspace for uploaded recordings.

Avoid language that implies:

- live meeting assistance
- realtime capture
- perfect speaker identification
- legal-grade certainty

Required disclosure:

`Speaker labels are automatically estimated and can be edited.`

## Committed direction

Salin now uses a **light-first transcript console** built from a **Newsroom Console + Bilingual Review Board hybrid**.

Core rules:

- cool neutral shell and white reading surfaces
- left-rail app shell for home and dashboard
- transcript-first hierarchy everywhere
- compact, editor-like controls instead of colorful dashboard chrome
- one sans family across headings, body, and controls
- mono only for timestamps, counts, and compact status markers
- color marks state and action, not feature ownership

Home carries the strongest brand voice. Dashboard and workspace stay restrained and operational.

## Theme guidance

- default mode is `light`
- dark mode is deferred
- any future dark theme must preserve transcript readability first

## Color roles

- `accent`: primary actions, saved edits, rename/apply flows
- `review`: transcript emphasis, active seek states, transcript-ready status
- `attention`: queued, generating, and estimated states
- `danger`: upload failures, processing failures, notes failures
- `success`: saved confirmation

Do not reintroduce the old purple notes lane or warm-beige shell.

## Screen structure

### Home

Route: `/`

Required elements:

- strong product statement for bilingual transcript review
- one transcript specimen
- one static product-proof panel
- concise workflow proof
- direct CTA into `/dashboard`

Home should feel like an in-product front door, not a generic landing page.

Current home direction:

- editorial hero inspired by modern transcription products, anchored by a review-console visual
- glass-morphism top navigation that stays readable over the hero and light page sections
- current Salin color system for buttons, badges, panels, and status accents
- direct path to the dashboard without implying live capture or realtime meeting behavior
- dashboard remains the only visible homepage CTA
- transcript specimen and product-proof panel remain visible below the hero to prove the app workflow
- below-hero content may use subtle scroll reveal animation when motion preferences allow it
- homepage anchor navigation should smooth-scroll to the visual center of product sections without hiding content under the fixed glass navigation
- mobile homepage navigation should remain compact, tappable, and close cleanly after section links are selected

### Dashboard

Route: `/dashboard`

Required elements:

- upload command deck as first priority
- source selector for local file upload or public YouTube URL import
- recording file picker
- YouTube video link input for presentation/demo intake
- language selector
- processing mode selector
- speaker count selector
- start-processing action
- route users into the workspace after either source is queued
- recent recordings library lives on `/library`

Dashboard expectations:

- upload remains visually strongest
- YouTube import must be framed as importing a saved public recording, not live capture
- the library is dense and calm
- library rows expose a compact destructive delete action with confirmation,
  without competing with the primary open-workspace action
- backend-off state routes into preview workspace
- the dashboard command deck must stay single-column, full-width, and tap-friendly on mobile after users enter from the home CTA

### Recording workspace

Route: `/workspace/[id]`

Required structure:

- thin session strip with back navigation, inline-editable filename, stage, notes state, and compact metadata
- sticky transcript toolbar under the strip
- desktop split:
  - transcript primary
  - notes secondary right dock
- mobile tabs fallback for `Transcript` and `Notes`

Transcript surface requirements:

- integrated audio review
- transcript search
- grouped transcript export menu
- speaker utility tray for global rename
- transcript rows with:
  - clickable timestamp rail
  - compact row action
  - collapsed inline edit form (stacked vertically with a textarea for segment text)

Notes dock requirements:

- generate or regenerate action
- save action
- dirty state
- grouped notes export menu once notes exist
- Markdown editor for generated or edited notes content

## State design

Every major surface should cover:

- empty upload selection
- active upload submission
- processing before transcript availability
- transcript-ready while diarization continues
- completed transcript state
- retryable processing failure
- notes generation failure while transcript remains available
- mobile tabs fallback without losing transcript or notes functionality

## Accessibility expectations

- all form controls need explicit labels
- timestamps remain readable before and after activation
- status text stays understandable without color alone
- transcript search stays keyboard reachable
- mobile tabs must switch transcript and notes without hiding required controls

## Testing expectations

Web E2E should cover:

- home page review-board framing and CTAs
- upload command deck with file and YouTube source paths
- desktop split workspace shell
- mobile transcript and notes tabs
- transcript search and timestamp seeking
- grouped transcript and notes export menus
- speaker rename plus per-row reassignment
- notes generation, edit, save, and failure handling
