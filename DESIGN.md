---
name: Lorisca Cessia Tuuk
description: People, operations and the data behind them. One design system for three sites.
colors:
  page: "#ffffff"
  mist: "#f2f5f9"
  mist-deep: "#e5ebf2"
  ink: "#1e2d42"
  steel: "#4a6a8f"
  cobalt: "#3f5fd0"
  cobalt-soft: "#e4e9fb"
  hairline: "#d6dfe9"
  band-dark: "#1e2d42"
  on-band-soft: "#cfdae6"
  ink-hover: "#2a3d58"
  page-dark: "#131c28"
  mist-dark: "#1b2635"
  ink-dark: "#e8eef5"
  steel-dark: "#9fb2c7"
  cobalt-dark: "#8ea4ff"
  hairline-dark: "#2d3d52"
typography:
  display:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(1.9rem, 4.2vw, 3.1rem)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  lede:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.18em"
rounded:
  sm: "6px"
  button: "10px"
  card: "14px"
  pill: "999px"
spacing:
  gutter: "clamp(1.25rem, 4vw, 3rem)"
  section: "clamp(4.5rem, 10vw, 9rem)"
  card-gap: "1.5rem"
  card-pad: "1.6rem"
  measure: "66ch"
  container: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.page}"
    rounded: "{rounded.button}"
    padding: "0.8rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-ghost:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0.8rem 1.5rem"
  header-cta:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.page}"
    rounded: "{rounded.pill}"
    padding: "0.55rem 1rem"
  card:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.6rem"
  band-dark:
    backgroundColor: "{colors.band-dark}"
    textColor: "{colors.on-band-soft}"
---

# Design System: Lorisca Cessia Tuuk

This file describes the design that is live on lori-sca.github.io, lorisca-analytics.github.io and lorisca-builds.github.io. All three load one shared file, `shared.css`, so its tokens are the source of truth. When this file and the code disagree, the code wins and this file gets updated.

## Overview

**Creative North Star: "The Built Road"**

The site follows one line: when there isn't a road, I build one. The ground is calm blue-grey, the structure is visible, and a single cobalt line shows the way. Nothing is decorative for its own sake. Every element either carries information or helps a reader find the next step.

The mood is calm and exact. Pages are uncrowded and easy to scan, with generous section spacing, a readable line length and very little motion. Personality lives in the writing, the journey map and small details, never in effects. Light and dark modes get equal care.

**Key Characteristics:**
- One accent, soft cobalt, used sparingly for emphasis and focus.
- Archivo for headlines, the device's own font for everything else.
- Flat surfaces with hairline borders. Depth appears only on hover.
- Dark bands stay dark in both themes.
- Motion is small, purposeful and switched off for reduced-motion users.

## Colors

A cool, low-saturation blue-grey ground with one cobalt accent. Text contrast is checked: ink is 13.9:1 on the page, steel is 5.6:1, cobalt is 5.6:1.

### Primary
- **Soft Cobalt** (#3f5fd0, dark mode #8ea4ff): the one accent. Emphasized words inside headlines, taglines, big numbers, focus rings and small markers. Never a large fill.
- **Cobalt Wash** (#e4e9fb, dark mode #24304f): a pale tint behind accent details.

### Neutral
- **Page** (#ffffff, dark mode #131c28): the page background. The token is named `--white` in code for history, so in dark mode it is dark.
- **Mist** (#f2f5f9, dark mode #1b2635): soft surfaces, card visuals, quiet panels.
- **Deep Mist** (#e5ebf2, dark mode #243245): a second surface step.
- **Ink** (#1e2d42, dark mode #e8eef5): main text and primary buttons.
- **Steel** (#4a6a8f, dark mode #9fb2c7): secondary text, ledes, links at rest, nav links.
- **Hairline** (#d6dfe9, dark mode #2d3d52): borders and dividers. Never used for text.
- **Night Band** (#1e2d42, dark mode #0c131d): sections set to dark in the admin. Text on it is white or pale steel (#cfdae6).

### Named Rules
**The One Line Rule.** Cobalt is the only accent. It marks the path (an emphasized word, a number, focus) and never fills a section.

**The Night Band Rule.** A section set to dark stays dark in both themes, with its own text colors.

## Typography

**Display Font:** Archivo, weights 600 to 800 (falls back to the device font)
**Body Font:** the device's own font stack (-apple-system, Segoe UI, Roboto and so on)

**Character:** Archivo gives headlines a firm, built feel. The device font keeps everything else fast, familiar and readable. Monospace labels were retired, so labels use the body font too.

### Hierarchy
- **Display** (800, clamp(1.9rem, 4.2vw, 3.1rem), 1.12): page hero headlines. An emphasized word may turn cobalt, never italic.
- **Title** (700, 1.45rem, 1.12, -0.02em): card and section titles.
- **Body** (400, 17px, 1.65): running text, kept to 66ch.
- **Lede** (400, 1.12rem, 1.7, steel): the sentence under a headline.
- **Label** (600, 0.72rem, 0.18em tracking, uppercase): eyebrows above sections, led by a short 3px ink bar.

### Named Rules
**The Two Voices Rule.** Archivo speaks in headlines, titles, big numbers and the brand name. Everything else uses the device font. Fewer than five font families in total.

## Layout

A centered 1200px container with fluid side gutters (clamp(1.25rem, 4vw, 3rem)) and a 12-column page grid for heroes. Sections breathe with clamp(4.5rem, 10vw, 9rem) of vertical space. Text blocks stop at 66ch. Card grids use a 1.5rem gap in two or three columns, and Work hub cards run one per row. The shared header becomes a menu below 860px, and wide cards stack picture first below 820px.

## Elevation & Depth

Flat by default. Surfaces separate with hairline borders and the mist tones, not shadows. A card answers hover by moving up 3px and darkening its border to ink. Shadows are kept for things that float above the page: the open mobile menu, the search panel and hover lifts on tilt cards.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 1px 2px rgba(30,45,66,.06), 0 8px 24px rgba(30,45,66,.08)`): the open menu, the search panel and hover lift. In dark mode, `0 1px 2px rgba(0,0,0,.3), 0 10px 28px rgba(0,0,0,.35)`.

### Named Rules
**The Flat Until Touched Rule.** Nothing casts a shadow at rest. Depth is a response to a pointer or a panel opening.

## Shapes

Soft but not round. Cards and panels use a 14px radius, buttons 10px, small blocks 6px. Pills (999px) are reserved for the header call to action, the theme and search buttons and small round controls. Borders are 1px hairlines. Card pictures sit in a 16:9 frame clipped by the card's corners.

## Components

### Buttons
Calm and exact, with no gradients or glow.
- **Shape:** 10px radius.
- **Primary:** ink background, page-colored text, 700 weight at 0.92rem, padding 0.8rem 1.5rem.
- **Hover / Focus:** primary darkens to #2a3d58. Focus shows a 2px cobalt outline 3px off the edge.
- **Ghost:** page background, ink text, hairline border that turns ink on hover.
- **Header call to action:** a small ink pill (0.55rem 1rem, 0.88rem, 600).

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** page color, picture area on mist.
- **Shadow Strategy:** none at rest. Hover lifts 3px and darkens the border (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal Padding:** 1.6rem, with a metric line in Archivo above a hairline at the bottom.

### Navigation
The brand name in Archivo 800 with a small steel subtitle, then steel links at 500 weight that turn ink on hover. The current page gets a 2px cobalt underline, or cobalt text inside the mobile menu. The header sits sticky on a 92% opaque page-colored bar. Below 860px it collapses into a menu with full-width rows.

### Work Card (signature)
The wide case-study card used on Home and the Work hub. Text on one side, a drawn picture on the other (two bars, a loss turning into a profit, or one big number). Under the hook runs a three-step trace line, problem to move to result, connected by a line with round markers.

## Do's and Don'ts

### Do:
- **Do** use the tokens in `shared.css`. Never hard-code a color that has a token.
- **Do** keep cobalt to emphasis, numbers and focus (The One Line Rule).
- **Do** give light and dark modes the same care and check both before shipping.
- **Do** keep pages uncrowded: one idea per section, text at 66ch or less.
- **Do** respect reduced motion. Every animation in this system has a reduced-motion off switch.
- **Do** keep new section types additive in `skeleton.js`, so the admin keeps working.

### Don't:
- **Don't** use serif display fonts such as Fraunces. Headlines are Archivo.
- **Don't** add gradients, glow, glassmorphism or other effects that read as AI-generated.
- **Don't** add shadows to surfaces at rest.
- **Don't** use hairline gray (#d6dfe9) for text. Fog grey (#7a90a6) also fails contrast on white, so text uses steel.
- **Don't** use italics for emphasis in headlines. Emphasis is cobalt.
- **Don't** add new motion without a reason. Little motion is the house style.
