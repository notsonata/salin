---
name: Salin
description: Transcript-first workspace for reviewing mixed-language recordings and shaping them into usable notes.
colors:
  primary: "#2d5b52"
  primary-soft: "#d9ebe7"
  tertiary-danger: "#8d3d2c"
  neutral-shell: "#ece4d8"
  neutral-canvas: "#f6f3ee"
  neutral-panel: "#fffcf7"
  neutral-line: "#d9d1c5"
  neutral-ink: "#15120f"
  neutral-muted: "#6b635a"
typography:
  headline:
    fontFamily: "\"Avenir Next\", Avenir, \"Segoe UI\", sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "\"Avenir Next\", Avenir, \"Segoe UI\", sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "\"Avenir Next\", Avenir, \"Segoe UI\", sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0"
  labelMono:
    fontFamily: "\"SF Mono\", Menlo, Consolas, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  md: "10px"
  lg: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  "2xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.neutral-ink}"
    textColor: "{colors.neutral-panel}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "#25211d"
  button-secondary:
    backgroundColor: "{colors.neutral-panel}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
    typography: "{typography.body}"
  button-secondary-hover:
    backgroundColor: "#fbf8f3"
  button-accent:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-panel}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
    typography: "{typography.body}"
  button-accent-hover:
    backgroundColor: "#254b44"
  card-default:
    backgroundColor: "{colors.neutral-panel}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge-default:
    backgroundColor: "#f2ede5"
    textColor: "{colors.neutral-muted}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
    typography: "{typography.labelMono}"
  input-default:
    backgroundColor: "#fbf8f3"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
    typography: "{typography.body}"
  transcript-segment:
    backgroundColor: "{colors.neutral-panel}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
  transcript-segment-active:
    backgroundColor: "#f3ede2"
---

# Design System: Salin

## 1. Overview

**Creative North Star: "The Study Desk"**

Salin should feel like a serious desk laid out for review work: transcript in front, notes at the side, metadata kept close, nothing decorative enough to interrupt reading. The atmosphere is warm without becoming cozy and premium without becoming soft. Every surface should help the user inspect language, confirm timing, and move cleanly from transcript to notes.

This is a transcript-first product UI, not a marketing dashboard and not an AI spectacle. The visual system rejects generic SaaS dashboard kits, flashy "AI copilot" visuals and gimmicks, and pastel, over-rounded startup UI. Warm neutrals, careful borders, and a single dark teal accent create trust through restraint rather than novelty.

**Key Characteristics:**
- Transcript-first hierarchy with side rails that support rather than compete.
- Warm layered neutrals with one disciplined accent.
- Modest radii (10px to 12px) and almost-flat depth.
- Sans for reading, mono for operational labels and status markers.
- Dense but calm composition for serious work sessions.

## 2. Colors

The palette is a warm paper stack held together by one disciplined teal and a rust failure color that only appears when the system needs to speak urgently.

### Primary
- **Review Teal** (`#2d5b52`): The main action color for notes generation, active timestamp controls, and other moments where the workspace commits to a user's next action.
- **Transcript Mint** (`#d9ebe7`): The softened companion to the primary accent, used behind active badges and quiet accent washes.

### Tertiary
- **Rust Alert** (`#8d3d2c`): Reserved for destructive and failure states. It should read as a firm warning, not as a brand accent.

### Neutral
- **Desk Shell** (`#ece4d8`): The outer application shell and the broadest warm background plane.
- **Paper Canvas** (`#f6f3ee`): The quieter interior field that supports dense content without feeling clinical.
- **Reading Panel** (`#fffcf7`): The main card and transcript surface background.
- **Quiet Line** (`#d9d1c5`): Borders, separators, and dividers.
- **Ink** (`#15120f`): Headings, transcript copy, strong buttons, and high-priority text.
- **Muted Ledger** (`#6b635a`): Supporting text, explanatory copy, and utility labels that should remain visible without challenging the transcript.

**The Rare Accent Rule.** The primary teal is reserved for action, active state, and meaningful emphasis. If it starts reading like decoration, it has been overused.

**The Warm Base Rule.** Warmth belongs in the neutrals, not in candy-colored highlights. The product should feel grounded, not sweet.

## 3. Typography

**Display Font:** `Avenir Next`, `Avenir`, `Segoe UI`, sans-serif
**Body Font:** `Avenir Next`, `Avenir`, `Segoe UI`, sans-serif
**Label/Mono Font:** `SF Mono`, `Menlo`, `Consolas`, monospace

**Character:** The typography is restrained and task-native. The sans stack does the reading work; the mono stack acts as a utility voice for counts, labels, and machine-adjacent metadata.

### Hierarchy
- **Headline** (`600`, `1.5rem`, `1.2`, `-0.02em`): Used for the top statement, recording filename, and the strongest page-level assertions.
- **Title** (`600`, `1.125rem`, `1.3`, `-0.02em`): Used for card headings, rail sections, and transcript or notes section titles.
- **Body** (`400`, `0.9375rem`, `1.65`): Used for transcript copy, instructional text, empty states, and working descriptions. Keep read-heavy blocks within roughly `65ch` to `75ch` when possible.
- **Label Mono** (`500`, `0.6875rem`, `1.4`, `0.18em`): Used for badges, counts, stage tags, and compact system markers.

**The Mono Stays Operational Rule.** Monospace is for labels, badges, and compact system markers. It does not take over transcript copy or long explanatory text.

**The Read-Through Rule.** Body copy must stay easy to scan at speed. If a surface asks for concentration, reduce ornament before you reduce contrast.

## 4. Elevation

Salin is a tonal-layering system with only one true shadow. Most depth comes from shell versus canvas versus panel shifts, border lines, and section breaks. Shadows exist as ambient edge definition, not as floating-card drama.

### Shadow Vocabulary
- **Panel Edge** (`0 1px 2px rgba(21, 18, 15, 0.06)`): The default card shadow, used only to separate reading panels from the warmer shell.

**The Flat-by-Default Rule.** Surfaces rest flat. If a component needs a deeper shadow than the panel edge, the hierarchy is probably wrong.

## 5. Components

### Buttons
- **Shape:** Gently curved edges (`10px` radius).
- **Primary:** A dark ink fill (`#15120f`) with light panel text (`#fffcf7`), `40px` height, and `16px` horizontal padding. Use for base submission and durable actions.
- **Accent:** A review teal fill (`#2d5b52`) with light panel text (`#fffcf7`). Use when the transcript already exists and the user is advancing into the next working layer, such as generating notes.
- **Secondary / Ghost:** Secondary keeps a light panel fill and visible line border; ghost stays transparent until hover. Both are for export, open, and low-risk utility work.
- **Hover / Focus:** Hover shifts are tonal only. Focus uses a visible `2px` outline with `2px` offset. No glow and no blur.

### Badges
- **Style:** Warm muted chips with mono uppercase labels (`11px`, `0.18em` tracking) and quiet borders.
- **State:** Badges communicate counts, stage labels, and status markers. Accent backgrounds appear only for active or meaningful state, never as decoration.

### Cards / Containers
- **Corner Style:** Modest rounding (`12px` outer card, `10px` internal callout).
- **Background:** Reading panels sit on `#fffcf7`. Callouts may step warmer (`#f4ede0`, `#faf6ee`) when they need to carve out a subsystem like notes or empty states.
- **Shadow Strategy:** Use the single panel-edge shadow only.
- **Border:** `1px` neutral line (`#d9d1c5`) or warmer variants for subsystem emphasis.
- **Internal Padding:** `20px` is the default working interior, with `16px` for denser rows and utilities.

### Inputs / Fields
- **Style:** Light paper fill (`#fbf8f3`), `1px` neutral line border, `10px` radius, `40px` height. Inputs should look integrated with the card they sit inside, not like detached app chrome.
- **Focus:** Use a clear outline shift rather than animated flourish. The active field should feel precise, not loud.
- **Error / Disabled:** Disabled states lower emphasis through text and background muting. Error states use rust (`#8d3d2c`) and warm error washes rather than saturated red alarms.

### Workspace Header
- **Style:** A compact two-column summary band with a hard bottom line and minimal ornament. The header establishes the session and then gets out of the way.
- **Typography:** The main statement uses the headline tier; supporting product framing stays in muted body copy.
- **Mobile treatment:** The structure collapses into a stacked briefing, preserving the main statement first and the secondary explanation below it.

### Transcript Segments
- **Style:** Two-part rows with timestamp utility on the left and transcript content on the right. The row is a reading unit first and a card second.
- **Active State:** The active row warms slightly (`#f3ede2`) while the timestamp control flips to the primary accent. This is the strongest state moment in the transcript surface and should stay rare.
- **Copy Rhythm:** Speaker label, provider, and activity badge stay compact above the transcript text so the actual words keep visual priority.

## 6. Do's and Don'ts

### Do:
- **Do** keep the transcript text and timestamp controls as the visual center of the workspace.
- **Do** use the primary teal on actions, active states, and confirmed emphasis only; keep it rare enough to matter.
- **Do** keep container corners between `10px` and `12px`. Pills belong to badges and controls, not to large surfaces.
- **Do** use mono labels for counts, stage tags, and utility metadata, while keeping reading copy in the sans system.
- **Do** separate depth with warm tonal planes, `1px` lines, and the single panel shadow before reaching for heavier elevation.

### Don't:
- **Don't** ship generic SaaS dashboard kits. If a screen could belong to any startup template, it has already lost the product's voice.
- **Don't** use flashy "AI copilot" visuals and gimmicks. No speculative glow, no novelty gradients, and no theatrical assistant chrome.
- **Don't** use pastel, over-rounded startup UI. Large containers stop at `12px` radius; anything softer starts looking generic.
- **Don't** let badges, side rails, or metadata tiles outrank the transcript itself.
- **Don't** flood the interface with accent teal or stack multiple warm tints until the page turns muddy.
- **Don't** deepen shadows past `0 1px 2px rgba(21, 18, 15, 0.06)` to manufacture hierarchy. Fix the layout or color order instead.
