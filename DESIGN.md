# Salin Design System

Salin is a post-recording transcript review tool for uploaded Tagalog, English, and Taglish recordings. The interface should feel like a calm bilingual review console, not a pastel AI dashboard and not a generic SaaS landing page.

## Direction

Use a **Newsroom Console + Bilingual Review Board hybrid**.

This is the committed replacement for the old Study Desk direction.

Core stance:

- transcript review is the center of gravity
- notes are a working document dock, not a separate AI lane
- home and dashboard use a persistent light app shell with a left rail
- the recording workspace drops into a thinner, more focused session shell
- color marks state, action, and selection, not feature ownership

## Theme

Use **light mode only for this pass**.

Why:

- transcript reading is the main task
- timestamps, metadata, and long bilingual segments stay clearer on light surfaces
- dark mode is deferred until it can preserve the same reading quality

## Color System

Use restrained OKLCH semantics:

- `canvas`: cool paper shell
- `panel`: crisp white work surfaces
- `field`: inset controls and utility strips
- `line`: quiet structure
- `ink`: primary text and strong controls
- `muted`: steel-muted support text
- `accent`: oxidized teal for primary actions and saved editing work
- `review`: inky blue for transcript review emphasis and seek states
- `attention`: amber for queued, generating, and estimated states
- `danger`: rust for failures
- `success`: green for saved confirmations

Rules:

- no purple notes lane
- no warm beige shell
- no decorative gradient slabs per feature
- large saturated surfaces are rare and mostly reserved for home emphasis

## Typography

- one sober sans stack across headings, body, and controls
- mono only for timestamps, counts, status chips, and compact metadata
- editorial heading rhythm, but not oversized marketing typography
- transcript rows should read comfortably over long sessions

## Layout Model

### Home

- product-native front door inside the app shell
- one strong statement
- one transcript specimen
- one recent-sessions board
- concise workflow proof
- direct CTA into dashboard and preview

### Dashboard

- upload remains the first priority
- upload is a compact command deck, not a hero card
- recent recordings read like a dense session library
- offline and empty states stay calm and useful

### Recording Workspace

- thin session strip at the top
- sticky transcript toolbar below it
- desktop split: transcript primary, notes secondary right dock
- mobile fallback: transcript and notes tabs
- global speaker management lives in a secondary utility tray
- transcript rows stay collapsed by default and reveal edits on demand

## Components

Use shadcn/ui primitives as the default foundation.

Required primitives for this shell:

- `button`
- `badge`
- `card`
- `input`
- `select`
- `textarea`
- `tabs`
- `table`
- `dropdown-menu`
- `scroll-area`
- `separator`
- `sheet`
- `tooltip`

Interaction rules:

- exports stay grouped in compact menus
- focus and hover are crisp, tonal, and readable
- transcript timestamps must remain legible before and after activation
- notes failure must never block transcript review
- speaker labels remain visibly estimated until edited

## Avoid

- generic card-grid landing pages
- equally weighted dashboard tiles
- giant hero blocks with product marketing language
- always-expanded per-row edit forms
- color-zoned feature surfaces
- dark mode polish before light mode readability is right
