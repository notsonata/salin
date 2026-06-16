# Salin UI/UX Revamp Plan

**Goal:** Rework the current Salin web UI into a premium, transcript-first review workspace while preserving the implemented upload, processing, transcript, notes, speaker correction, and export flows.

**Recommendation:** Use the existing Salin "Study Desk" design system as the product identity, borrow Trint-style transcript review workflow patterns, and apply Linear-style light-mode control polish. This should feel like a serious reading and editing workspace, not a live meeting assistant, generic SaaS dashboard, or decorative AI product.

**Status:** Initial implementation complete.

---

## Product Guardrails

- Salin remains an uploaded recording-to-notes workspace.
- The transcript is the primary artifact on the detail screen.
- Notes are immediately discoverable but visually secondary to transcript review.
- Speaker labels stay visibly estimated unless edited.
- Transcript review must remain useful when diarization is incomplete or imperfect.
- Failed downstream steps must not hide existing transcript content.
- The UI must not imply live meeting behavior, realtime transcription, perfect speaker identity, or legal-grade accuracy.

## Design Direction

### Chosen Combination

Use this blend:

1. **Salin Study Desk**
   - Warm neutral surfaces
   - Dense but calm layout
   - Transcript-first hierarchy
   - Small operational labels
   - Serious review-work atmosphere

2. **Trint Workflow Reference**
   - Transcript editor as the main surface
   - Media controls close to transcript review
   - Timestamp navigation
   - Search, speaker labels, notes, and export as working tools

3. **Linear Control Polish**
   - Light-mode compatible premium controls
   - Crisp icon buttons
   - Low-shadow, border-led interface
   - Compact toolbars and menus
   - Clear hover, focus, active, and disabled states

4. **Readwise-Like Reading Calm**
   - Comfortable transcript reading rhythm
   - Long-form text should feel reviewable for extended sessions
   - Notes should feel like a working document rather than a metadata card

### Anti-References

Avoid:

- Live meeting bot framing
- Otter/Fireflies/Fathom-style meeting assistant positioning
- Oversized hero sections
- Floating dashboard shells
- Decorative gradients, glows, and abstract "AI" visuals
- Generic SaaS card grids
- Over-rounded pastel startup UI
- Visual clutter that competes with transcript text

## Visual System

Use the Tailwind palette in `apps/web/tailwind.config.ts` as the source of truth:

- Base: canvas, panel, field, line, ink, muted
- Brand: brandDeep, brandPanel, brandLine, brandMuted
- Upload/correction/actions: accent, accentSoft, accentFaint
- Transcript review: review, reviewSoft, reviewFaint
- Notes workspace: notes, notesSoft, notesFaint
- Processing/attention: attention, attentionSoft, attentionFaint
- Failures: danger, dangerSoft, dangerFaint
- Completion/saved states: success, successSoft

Color should be mostly soft fills, borders, icon accents, badges, and active states. Avoid turning every repeated card into a different saturated color.

### Control Treatment

Trint-like editor buttons can absolutely be darkened to match the Linear-inspired direction. Use dark ink icons by default, muted icons for secondary state, teal only for active or confirmed actions, and rust only for errors or destructive actions.

Recommended control colors:

- Default icon: `#15120f`
- Secondary icon: `#6b635a`
- Active upload/correction icon: `#28665d`
- Active transcript icon: `#2f5f98`
- Active notes icon: `#6a4a8d`
- Disabled icon: `rgba(107, 99, 90, 0.45)`
- Panel background: `#fffdf8`
- Hover background: `#f2ece2`
- Subtle field background: `#fbf8f2`
- Border: `#ddd3c4`

Recommended shape:

- Icon buttons: compact square controls, 36px to 40px
- Toolbars: flat panel with border, no heavy shadow
- Cards: modest radius and clear border
- Large surfaces: avoid pill shapes
- Badges: mono, compact, warm muted fills

## Icon System

Use `lucide-react` icons before custom SVGs.

Recommended icon map:

- Upload: `UploadCloud`
- Search: `Search`
- Play: `Play`
- Pause: `Pause`
- Timestamp or duration: `Clock`, `Timer`
- Transcript: `FileText`
- Notes: `NotebookPen`
- Export menu: `Download`
- PDF/file export: `FileDown`
- Regenerate: `RefreshCw`
- Speaker: `UserRound`
- Speaker group: `UsersRound`
- Edit speaker: `Pencil`
- Save notes: `Save`
- More actions: `MoreHorizontal`
- Filters/settings: `SlidersHorizontal`
- Completed state: `CheckCircle2`
- Warning/error: `CircleAlert`

Rules:

- Use icon-only controls for common workspace actions when a tooltip is present.
- Use icon plus text for destructive, primary, or less obvious commands.
- Keep icon stroke visually dark enough for the warm light theme.
- Do not use teal for every icon; teal should mean active, selected, or committed.

## Screen Plan

### 1. Dashboard

Purpose:

- Start a new recording quickly.
- Reopen recent work.
- Show processing status without feeling like an admin panel.

Route:

- `/dashboard`

Related home route:

- `/` is a dedicated product home with a deeper color band, transcript preview, concise workflow explanation, and routes into the dashboard or preview workspace.

Recommended structure:

- Compact app header
- New recording composer as the first working surface
- Recent recordings as a dense table below
- Status chips for upload, processing, diarizing, completed, failed
- Small side guidance only if it helps with file expectations

Key changes:

- Reduce decorative introductory copy.
- Keep the upload composer strong but not hero-like.
- Make the recent recordings table feel more premium and easier to scan.
- Use compact action buttons with dark icons.

### 2. Recording Detail Header

Purpose:

- Orient the user inside one recording.
- Show state without stealing attention from transcript review.

Recommended structure:

- Back to dashboard control
- Filename as the strongest text
- Processing stage chip
- Notes status chip
- Provider/fallback note when useful
- Retry control only when relevant

Key changes:

- Turn the header into a thin session strip.
- Avoid making the header a large card.
- Keep failure and fallback messages visible but calm.

### 3. Transcript Workspace

Purpose:

- Let the user read, search, verify, and correct transcript content.

Recommended structure:

- Audio player dock near the transcript controls
- Toolbar with search, export, speaker tools, and utility actions
- Transcript rows with timestamp rail, speaker label, provider/status metadata, and text
- Active transcript row state when audio is seeking or playing
- Clear estimated-speaker disclaimer near speaker controls

Key changes:

- Make transcript rows feel like reading units, not isolated cards.
- Keep timestamps visually available and clickable.
- Move export controls into a polished menu or grouped toolbar.
- Keep speaker editing compact and visibly estimated.

### 4. Notes Workspace

Purpose:

- Generate and edit structured notes from stored transcript data.

Recommended structure:

- Notes action row with generate/regenerate/save
- Dirty-state badge
- Summary textarea
- Editable lists for key points, decisions, action items, and questions
- Clear failure state that does not affect transcript review

Key changes:

- Make notes feel like a document surface.
- Keep notes secondary but not hidden.
- Preserve warnings for unsaved edits and destructive regenerate.

### 5. Export Controls

Purpose:

- Let users download transcript, notes, or combined output without visual clutter.

Recommended structure:

- One compact export menu on the recording detail screen
- Transcript exports available once transcript blocks exist
- Notes and combined exports available once notes exist
- TXT and PDF choices grouped clearly

Key changes:

- Replace scattered export links with a cohesive export control.
- Use `Download` or `FileDown` icons.
- Keep backend-backed export behavior unchanged.

### 6. Processing and Failure States

Purpose:

- Make long processing feel alive and understandable.

Recommended structure:

- Stage tracker: Upload, Normalize, Transcribe, Diarize, Notes
- Chunk progress copy when available, such as `Transcribing chunk 3/12`
- Non-fatal warnings for fallback transcription or diarization failure
- Retry controls scoped to the failed step when possible

Key changes:

- Show that transcript review is ready even if diarization is still running.
- Avoid vague "still processing" states.
- Keep failure copy honest and short.

## Implementation Phases

### Phase 0: UI Audit and Screenshot Baseline

- Capture current dashboard and recording detail at desktop and mobile widths.
- Identify which components are kept, reshaped, or replaced.
- Check current text overflow, spacing, and tab behavior.
- Confirm the revamp does not require backend changes.

### Phase 1: Design Tokens and Shared UI Primitives

- Tighten shared button, badge, input, card, tab, and toolbar styles. **Done**
- Add or refine an icon button pattern with tooltip support. **Partially done through darker lucide button controls**
- Add a compact workspace toolbar pattern. **Done**
- Add a menu pattern for export actions. **Done as a grouped export toolbar**
- Keep shadcn/ui components as the base where available.

### Phase 2: Dashboard Polish

- Rework the dashboard hierarchy around the upload composer and recent table. **Done**
- Separate product home from upload/history dashboard. **Done**
- Improve status chips and table actions. **Done**
- Darken utility icons and align hover/focus states. **Done**
- Validate empty, loading, and failed recordings-list states. **Done through E2E and browser audit**

### Phase 3: Recording Detail Polish

- Convert the header into a compact session strip. **Done**
- Refine transcript and notes tab controls. **Done**
- Improve transcript row layout, timestamp rail, speaker badges, and active row state. **Done**
- Keep the audio player and search controls visually close to transcript review. **Done**

### Phase 4: Notes, Export, and Progress Polish

- Restyle notes as a structured document workspace. **Done**
- Move export links into a cohesive menu.
  **Done as a cohesive toolbar so existing export links remain directly accessible**
- Improve processing stage presentation and non-fatal failure notes. **Done**
- Preserve all existing transcript, notes, speaker correction, and export functionality. **Done**

### Phase 5: Responsive, Accessibility, and E2E Pass

- Verify desktop and mobile layout in the browser. **Done with DOM overflow audits**
- Check keyboard access for upload, tabs, timestamp controls, notes editing, export menu, and retry controls. **Covered by semantic controls and E2E**
- Confirm no text overlaps or button labels overflow. **Done**
- Run focused web validation after the visual refactor. **Done**

## Acceptance Criteria

- The home page communicates a working recording-to-notes product and routes into the app without blocking repeat users.
- The dashboard is focused on upload and recent recordings rather than product explanation.
- Dashboard upload remains the top-priority action.
- Recent recordings are compact and easy to scan.
- Recording detail keeps transcript review visually primary.
- Notes remain immediately discoverable.
- Speaker labels are marked as estimated until edited.
- Timestamps are readable, clickable, and clearly part of transcript review.
- Export actions are grouped into a polished control surface.
- Processing states communicate stage and progress clearly.
- Transcript review remains visible when downstream diarization or notes work fails.
- The interface avoids live meeting language and overconfident speaker identification.
- Desktop and mobile layouts have no overlapping text or controls.
- Existing E2E user flows still pass after the UI work.

## Files Expected To Change During Implementation

- `apps/web/app/page.tsx`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/recordings/[id]/page.tsx`
- `apps/web/components/*`
- `apps/web/app/globals.css`
- `apps/web/tests/e2e/upload.spec.ts`
- `docs/ui.md`

Possible new components:

- `apps/web/components/icon-button.tsx`
- `apps/web/components/workspace-toolbar.tsx`
- `apps/web/components/export-menu.tsx`
- `apps/web/components/processing-stage-tracker.tsx`

## Non-Goals

- No backend pipeline rewrite.
- No transcription provider changes.
- No diarization provider changes.
- No auth, team accounts, billing, or mobile app work.
- No live transcription or meeting bot behavior.
- No new product scope beyond the existing v1 workflow.

## Open Product Decisions

Recommended defaults are listed first.

- **Transcript/Notes navigation:** keep the current tabs for now; consider split view only after the core polish lands.
- **Export pattern:** use one export menu instead of multiple visible links.
- **Audio player prominence:** keep it close to transcript controls, not as a large media centerpiece.
- **Dashboard personality:** stay conservative and functional; avoid a marketing-style hero.
- **Icons:** use dark lucide icons with tooltips, adding text labels only when the command is not obvious.

## References

- Trint Editor: transcript editing and review workflow reference.
- Descript Editor: media/transcript workspace reference, without adopting creator timeline complexity.
- Sonix: transcript search, speaker, timestamp, and export affordance reference.
- Readwise Reader: calm long-form reading surface reference.
- Linear: light-mode control density, polish, and restrained product UI reference.
