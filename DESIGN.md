---
name: VietDrobe
description: An editorial Vietnamese traditional dress catalog, styling studio, and rental experience.
colors:
  paper: "#f5f1e9"
  ink: "#24251f"
  paper-surface: "#fffdf8"
  white: "#ffffff"
  paper-subtle: "#eee9df"
  paper-border: "#d8d0c1"
  paper-border-subtle: "#e8e1d5"
  text-secondary: "#625f56"
  text-muted: "#797468"
  seal-rust: "#9f3b30"
  seal-rust-border: "#873126"
  seal-text: "#fff9ef"
  deep-olive: "#323b31"
  night-paper: "#191d1a"
  night-ink: "#eae5d9"
  night-surface: "#232923"
  night-surface-subtle: "#2c332c"
  night-border: "#485047"
  night-border-subtle: "#343b34"
  night-text-primary: "#eee8dc"
  night-text-secondary: "#c3bbae"
  night-text-muted: "#aaa495"
  night-rust: "#d16f5d"
  night-seal: "#bd5b4c"
  night-seal-border: "#d07869"
typography:
  display:
    fontFamily: "Cormorant Garamond, Cambria, Georgia, serif"
    fontSize: "clamp(56px, 6.3vw, 102px)"
    fontWeight: 400
    lineHeight: 1.07
    letterSpacing: "-.03em"
  headline:
    fontFamily: "Cormorant Garamond, Cambria, Georgia, serif"
    fontSize: "clamp(42px, 4.4vw, 68px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-.025em"
  title:
    fontFamily: "Cormorant Garamond, Cambria, Georgia, serif"
    fontSize: "clamp(35px, 3.4vw, 54px)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-.025em"
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontWeight: 400
    letterSpacing: "-.01em"
  label:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: ".1em"
rounded:
  square: "0"
  chip: "9999px"
spacing:
  card-gap: "24px"
  mobile-card-gap: "12px"
  studio-stack-gap: "28px"
components:
  button-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    height: "49px"
    padding: "0 23px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    height: "49px"
    padding: "0 20px"
  garment-card:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
  studio-chat:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
---

# Design System: VietDrobe

## Overview

**Creative North Star: "The Living Wardrobe"**

VietDrobe presents Vietnamese traditional dress as something to explore, combine, and wear today. The interface uses the quiet structure of an editorial page: warm paper, deep ink, fine borders, open space, and expressive serif headings. Rust marks an action or selected state; olive supports the garment illustration and the darker atmosphere.

The catalog and rental path carry the same visual weight as guided styling. The studio has a working, three part composition, with chat given the widest default column. Garment illustrations and cultural context are the visual subject; the app does not use AI generated imagery.

**Key Characteristics:**
- Warm paper and ink in light mode; olive tinted dark surfaces in dark mode.
- Self hosted Cormorant Garamond display type with a plain sans serif interface.
- Square panels, fine borders, and selective rust emphasis.
- Two equally visible journeys from the home page: browsing garments and AI styling.

## Colors

The palette takes its warmth from paper and cloth, with rust used as a small but clear signal.

### Primary

- **Seal Rust** (`seal-rust`): active navigation, selected tabs, garment badges, focus, and button hover. Its dark mode counterpart is `night-rust`.

### Secondary

- **Deep Olive** (`deep-olive`): the home garment illustration field and a heritage toned counterpart to paper. Dark mode uses olive tinted `night-paper` and `night-surface`.

### Neutral

- **Warm Paper** (`paper`): light page background. **Paper Surface** (`paper-surface`) is used for cards and panels; **Soft Paper** (`paper-subtle`) separates broad sections.
- **Ink** (`ink`): primary text and solid action buttons. **Secondary Ink** (`text-secondary`) and **Muted Ink** (`text-muted`) carry supporting copy and metadata.
- **Paper Borders** (`paper-border`, `paper-border-subtle`): navigation rules, cards, fields, and quiet dividers.
- **Night Paper and Ink** (`night-paper`, `night-ink`, `night-text-primary`): dark mode foundation and high contrast text; night surfaces and borders follow the paired dark tokens above.

**The Rust Signal Rule.** Use rust for purposeful emphasis such as selection, focus, and action feedback, rather than broad surface fills.

## Typography

**Display Font:** Self hosted Cormorant Garamond (Cambria, Georgia, serif fallback), including Latin and Vietnamese subsets at regular and semibold weights.

**Body Font:** Segoe UI (Arial, sans serif fallback). Supporting editorial copy also uses Cambria, Georgia, and Times New Roman.

**Character:** Large, lightly weighted display headings give the pages a literary voice. Small uppercase sans serif labels keep navigation and actions precise.

### Hierarchy

- **Display** (`display`): home hero title; large, regular, tight tracking.
- **Headline** (`headline`): interior page titles, smaller on narrow screens.
- **Title** (`title`): section headings and path titles.
- **Body** (`body`): controls and general interface copy. Editorial introductions use the serif stack at roughly 15–18px with open line height.
- **Label** (`label`): uppercase actions and navigation with expanded tracking. Garment names use semibold serif text.

**The Two Voices Rule.** Use the display serif for identity and editorial hierarchy; use the sans serif for navigation, controls, and compact metadata.

## Layout

The shared shell is capped at 1440px with 64px total horizontal inset, reducing to 36px below 760px. The home hero is a two column text and artwork composition; its two main route links have equal columns. At 760px, both become vertical stacks.

The desktop studio uses a wider shell capped at 1900px. Its initial columns are 21% garment picker, a flexible chat column, and 22% outfit canvas, with 12px draggable dividers. Pointer and keyboard resizing preserve at least 34% for chat. At 1100px and below, the studio stacks chat, picker, then canvas; dividers disappear. The panel height tracks the viewport within a 460–800px range on desktop and has separate compact heights on smaller screens.

Catalog cards use a 24px gap on larger screens and 12px below 760px. The interface relies on broad section spacing and controlled local padding rather than a dense tile grid.

**The Equal Entry Rule.** Home page routes to garment browsing and guided styling are parallel choices, neither hidden behind the other.

## Elevation & Depth

The system is flat by default. Paper tones and one pixel borders separate sections, cards, and controls. The garment card rises slightly with a soft shadow on hover; the hero artwork has a single diffuse shadow. Modal overlays have stronger elevation to establish focus.

### Shadow Vocabulary

- **Hero artwork** (`18px 22px 40px rgba(32,39,31,.12)`): the large garment illustration only.
- **Garment hover** (`0 16px 30px rgba(28,31,25,.08)`): interactive catalog cards only.

**The Quiet Surface Rule.** Keep resting cards and studio panels border led; reserve lift for hover or overlay hierarchy.

## Shapes

The core form is square: buttons, garment cards, studio panels, fields, and interior page containers use zero radius. Fine one pixel strokes organize content. Pill corners are limited to chat prompt chips; the home closer's circular mark and the hero illustration's rings are deliberate graphic accents, not a general card shape.

## Components

### Buttons

- **Shape:** Square with compact uppercase sans serif labels and expanded tracking.
- **Primary:** Ink fill with paper text and a 49px minimum height; hover turns rust and lifts 2px on home actions. Interior rental actions follow the same ink to rust progression.
- **Outline and text:** The outline button has an ink border and fills ink on hover. Text actions use a bottom rule and change to rust on hover.
- **Focus:** A 2px rust outline with offset is the shared keyboard treatment. Disabled controls reduce opacity where used.

### Chips

- **Style:** Studio prompt chips are the one pill shaped control, with surface fill, thin border, and secondary text.
- **State:** Hover shifts text and border to rust. Selected category tabs use a rust underline instead of a filled pill.

### Cards / Containers

- **Garment cards:** Square paper surface, thin border, image first, then serif name and quiet metadata. The category label sits over the image. Hover adds a small rise, accent border, image zoom, and soft shadow.
- **Studio panels:** Square bordered surfaces. The center chat is the dominant desktop column; picker and canvas flank it. The canvas contains a separately bordered cultural score and direct rental action.

### Inputs / Fields

- **Style:** Square, light surface fill, paper border, dark ink text; dark mode uses the paired night tokens.
- **Focus:** Rust border or the shared rust outline. Carets use the accent color.

### Navigation

The sticky header is 82px high on desktop and 70px below 760px. The brand combines a fine bordered initial mark with Cormorant Garamond wordmark. Desktop links are compact sans serif labels with a rust active underline; mobile uses a menu of larger serif links. Theme switching is a visible bordered square control.

### Studio Dividers

The two narrow vertical dividers have a centered grip and rust hover or focus state. They support pointer dragging, left and right arrow keys, larger Shift key steps, and double click reset. They disappear when the studio stacks.

## Do's and Don'ts

### Do:

- **Do** keep browse and rent, and AI styling, equally easy to enter.
- **Do** use supplied garment artwork and show garment identity and cultural context clearly.
- **Do** pair rust emphasis with visible text or border changes so states remain legible in both themes.
- **Do** preserve the chat first stack and its roomy desktop column in the studio.

### Don't:

- **Don't** introduce AI generated images into the app.
- **Don't** round ordinary cards, panels, buttons, or fields.
- **Don't** use heavy resting shadows where a paper tone and thin border carry the separation.
