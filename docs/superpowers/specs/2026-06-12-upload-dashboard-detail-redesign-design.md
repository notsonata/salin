# Upload Dashboard + Recording Detail Redesign

## Summary

Salin's current web UX is structurally broken for repeat use. Upload lives on `/`, then the user is pushed into a standalone recording workspace with no durable path back to a broader home, no recordings history, and no clear product-level navigation. The result feels like a disconnected demo rather than a usable transcription workspace.

This redesign replaces that shape with an upload-first dashboard and a proper recording detail view. The dashboard becomes the product home. Recording detail becomes the active work surface. Notes move from generated-only output to an editable structured workspace.

## Goals

- Make `/` the durable system home for repeat use.
- Keep upload as the first-priority action on the dashboard.
- Give users a compact recent-recordings history so they can reopen work quickly.
- Make `/recordings/[id]` a real detail page with obvious `Back to dashboard` navigation.
- Separate transcript and notes work into tabs.
- Preserve transcript-first review while allowing structured notes editing.
- Add the minimum API surface needed to support dashboard history and notes editing.

## Non-Goals

- Do not add speaker editing in this redesign.
- Do not add PDF export or notes TXT export in this redesign.
- Do not add auth, multi-user workspaces, or team constructs.
- Do not change the underlying transcription pipeline or worker orchestration.

## Chosen Product Structure

### Information Architecture

- `/`
  - Upload-first dashboard
  - New recording composer
  - Recent recordings table
- `/recordings/[id]`
  - Recording detail header
  - `Transcript` tab
  - `Notes` tab

### Post-Upload Behavior

- Creating a recording still routes the user directly to `/recordings/[id]`.
- The recording detail header must always provide an obvious `Back to dashboard` action.
- The dashboard remains the home users can return to at any time.

## Dashboard Design

### Primary Job

The dashboard's primary job is to start a new upload quickly. Its secondary job is to reopen or monitor existing recordings.

### Layout

- Top section: `New recording`
  - file picker
  - language selector
  - processing mode selector
  - speaker count selector
  - primary submit action
  - concise quality guidance
- Second section: `Recent recordings`
  - compact table
  - serious, utility-first presentation

### Recent Recordings Table

Required columns:

- filename
- status
- language
- updated time
- action (`Open`)

Optional row metadata may include processing mode or file size only if it fits without bloating the table.

### Empty State

If no recordings exist yet:

- the upload composer remains primary
- the history section explains what will appear there
- the page must still feel like a product home, not an empty scaffold

## Recording Detail Design

### Header

Required elements:

- `Back to dashboard`
- filename
- processing status
- compact metadata summary
- retry action when the job is failed and retryable

The header must establish orientation immediately. Users should never wonder whether they are in a one-off workspace or a reusable product surface.

### Tabs

Required tabs:

- `Transcript`
- `Notes`

Rules:

- default tab is `Transcript`
- processing states are surfaced within the transcript tab context
- tab switching must not discard local notes edits silently

## Transcript Tab

### Before Completion

The tab must clearly cover these states:

- uploaded
- preprocessing
- transcribing
- failed

For these states, the page should show:

- current job stage
- short explanation of what is happening
- retry affordance when allowed
- no false promise of finished transcript content

### After Completion

The transcript tab remains the dominant review surface and keeps:

- normalized audio review
- open original upload action
- transcript search
- timestamp seek buttons
- transcript TXT export

The transcript stays primary in hierarchy. Metadata, guidance, and controls must support review rather than crowd it.

## Notes Tab

### Notes Model

Use the existing structured notes shape:

- summary
- key_points
- decisions
- action_items
- questions

### Editing Model

Use a structured editor:

- `summary` as a textarea
- all other sections as editable lists
- add item action per list
- remove item action per list item
- inline editing for saved/generated items

### Actions

Required actions:

- `Generate notes` when notes are idle
- `Regenerate notes` when notes exist or generation previously failed
- `Save edits` when the user has unsaved changes

### Dirty-State Rules

- local edits set a dirty state immediately
- dirty state must be visible
- saving clears dirty state
- navigating away from the page or tab with unsaved changes must warn or block silent loss
- regenerating notes while unsaved edits exist must warn the user before destructive overwrite

### Failure Rules

- notes generation failure must stay scoped to the notes experience
- transcript review must remain unaffected
- if previously saved notes exist, they remain visible during regeneration attempts until new content succeeds

## API Changes

### New Endpoint: `GET /recordings`

Purpose:

- populate the dashboard recordings table

Response should include enough row data to render:

- recording summary
- latest processing job summary
- notes status summary

At minimum each row needs:

- recording id
- filename
- language
- processing mode
- updated timestamp
- current job stage
- retryable flag
- notes status

### New Endpoint: `PUT /recordings/{recording_id}/notes`

Purpose:

- persist structured notes edits from the notes tab

Request payload should mirror the editable notes shape:

- summary
- key_points
- decisions
- action_items
- questions

Response should return the saved notes summary in the same structure used by the detail page.

## Web Architecture Changes

### Route-Level Changes

- Replace the current upload-only home page with a dashboard page.
- Keep `/recordings/[id]`, but split the current monolithic workspace into focused sections.

### Component Direction

Target component split:

- dashboard page
  - upload composer
  - recordings table
- recording detail page
  - detail header
  - tabs shell
  - transcript tab panel
  - notes tab editor

The current `RecordingWorkspace` component should not absorb the redesign. It should be decomposed or replaced so dashboard responsibilities and detail responsibilities stay separate.

## Shared Types and Client Changes

The shared TypeScript API layer must add:

- recordings list response types
- notes update request/response types
- browser client methods for:
  - listing recordings
  - updating notes

## Testing Requirements

### API

Add or update integration coverage for:

- recordings list endpoint
- structured notes update endpoint

### Web E2E

Add or update coverage for:

- dashboard loads with upload-first hierarchy
- dashboard renders recordings history
- upload from dashboard redirects to detail page
- detail page includes clear dashboard return
- transcript and notes tabs both render correctly
- structured notes editing and saving
- unsaved edits behavior, if implemented with explicit warning or guard

Keep tests focused. One strong happy path plus meaningful failure or edge paths is enough.

## Acceptance Criteria

- `/` is a durable dashboard, not a one-shot upload form.
- Dashboard upload remains the most prominent action.
- Dashboard shows recent recordings in a compact table.
- Upload redirects to `/recordings/[id]`.
- Recording detail provides obvious `Back to dashboard` navigation.
- Recording detail uses `Transcript` and `Notes` tabs.
- Transcript tab preserves audio review, transcript search, timestamp seeking, and transcript TXT export.
- Notes tab supports structured editing and saving.
- API supports recordings listing and notes updates.
- Shared client/types and tests are updated to match.

## Implementation Order

1. Add backend support for recordings listing.
2. Add backend support for structured notes updates.
3. Regenerate shared API types and extend the shared client.
4. Rebuild the dashboard route.
5. Rebuild the recording detail route around header + tabs.
6. Add notes structured editor behavior.
7. Update API and Playwright coverage.
