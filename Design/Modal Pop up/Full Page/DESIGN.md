---
name: Kinetic Clarity
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#474554'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#787586'
  outline-variant: '#c8c4d6'
  surface-tint: '#5648d1'
  primary: '#5445cf'
  on-primary: '#ffffff'
  primary-container: '#6d60e9'
  on-primary-container: '#fffbff'
  inverse-primary: '#c5c0ff'
  secondary: '#00668a'
  on-secondary: '#ffffff'
  secondary-container: '#40c2fd'
  on-secondary-container: '#004d6a'
  tertiary: '#a33251'
  on-tertiary: '#ffffff'
  tertiary-container: '#c34b69'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c5c0ff'
  on-primary-fixed: '#140067'
  on-primary-fixed-variant: '#3d2bb9'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffd9de'
  tertiary-fixed-dim: '#ffb2bf'
  on-tertiary-fixed: '#3f0015'
  on-tertiary-fixed-variant: '#871b3c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system embodies an energetic, hyper-focused, and premium consumer productivity experience. It bridges the razor-sharp intentionality of developer-grade tools with the warmth, tactile charm, and delight of next-generation lifestyle software. 

The emotional signature is empowering, bright, and friction-free: the interface should make planning feel like play and progress feel celebratory. Visually, the system adopts a **Refined Modern Glass & Bento** aesthetic—clean geometry, luminous colored accents, subtle frosted depth, and fluid micro-transitions that reward every action with a sense of momentum.

## Colors

The palette leverages high-chroma primary and accent values structured over a balanced, breathable off-white foundation (`#F8F9FD`). 

- **Primary (`#7367F0` Electric Violet):** Commands primary actions, global navigation active states, high-priority project anchors, and focused interactions.
- **Secondary (`#38BDF8` Sky Blue):** Powers informational tags, calendar time blocks, active track meters, and secondary interactive flows.
- **Accent / Tertiary (`#FF7997` Coral Pink):** Highlights urgent deadlines, priority flags, celebratory badges, and playful accents.
- **Functional Semantics:** 
  - *Success / Fresh Mint (`#34D6B0`):* Task completions, streak streaks, and positive metrics.
  - *Warning / Warm Amber (`#F8C65C`):* Impending deadlines, paused tasks, and review states.
- **Neutral Stack:** Base background utilizes `#F8F9FD`, card surfaces utilize pure white `#FFFFFF` with translucent variants (90% alpha over blurs), and typography scales from `#0F172A` (deep obsidian body) to `#64748B` (slate neutrals) and `#94A3B8` (subtle captions).

## Typography

The design system relies on **Plus Jakarta Sans** across all roles to ensure geometric balance, modern flair, and humanistic warmth. 

- **Headlines & Display:** Tightly tracked headings (-0.02em to -0.03em) prevent visual sprawl and inject a polished editorial rhythm into dashboards and view headers.
- **Body:** Standard neutral spacing, keeping reading effortless across long-form descriptions and nested subtasks.
- **Labels & Micro-copy:** Uppercase or small micro-labels (`label-sm`) carry positive tracking for crisp readability inside compact badges, Kanban column counters, and status tags.

## Layout & Spacing

The layout is grounded in a flexible **Bento Grid Architecture**, allowing cards of unequal weight to lock into modular, visually harmonious structures.

- **Grid Structure:** A 12-column fluid grid on desktop (min 1280px) transitioning to an 8-column layout on tablet (768px - 1279px) and a single-column stacked flow on mobile (&lt;768px).
- **Rhythm & Alignments:** Strict 4px/8px modular base. Gaps between bento tiles default to `gutter` (20px), while internal card paddings use `space-lg` (24px) for expansive hero cards and `space-md` (16px) for compact widgets.
- **Reflow Rules:** Horizontal Kanban columns switch to swipeable tabs on small screens, while sidebar panels collapse into an off-canvas drawer or a sticky bottom action bar.

## Elevation & Depth

Depth is established via **chromatic ambient shadows** paired with semi-translucent glass surfaces to avoid dull gray cast shadows.

- **Surface Base:** Card containers use `#FFFFFF` at 92%–96% opacity paired with `backdrop-filter: blur(16px)` when placed over ambient workspace gradients.
- **Soft Dual-Layer Shadow (Resting State):** 
  - Layer 1: `0 2px 4px -1px rgba(115, 103, 240, 0.04)`
  - Layer 2: `0 12px 24px -4px rgba(15, 23, 42, 0.06)`
  - Border: 1px hairline border using `rgba(226, 232, 240, 0.8)` or `rgba(255, 255, 255, 0.6)` on layered tiles.
- **Lifted / Floating Elevation (Active Cards, Quick-Add, Modals):**
  - Layer 1: `0 8px 16px -2px rgba(115, 103, 240, 0.12)`
  - Layer 2: `0 24px 48px -12px rgba(15, 23, 42, 0.12)`
  - Subtle top-edge inner specular highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.8)`.

## Shapes

The geometric vocabulary prioritizes organic, friendly, and smooth contours. 

- **Primary Cards & Bento Modules:** Default to `16px` (`rounded-lg`), scaling to `20px` (`rounded-xl`) for main application hero banners and modals.
- **Interactive Controls (Inputs, Buttons, Segmented Controls):** Built with `8px` to `12px` border-radii for tactile comfort.
- **Pills & Metatags:** Fully rounded (`9999px`) for task statuses, priority chips, and progress avatars, contrasting cleanly with the geometric grid tiles.

## Components

- **Buttons:**
  - *Primary:* Electric Violet gradient fill (`linear-gradient(135deg, #7367F0 0%, #8E85F3 100%)`), white label, soft violet drop shadow. Subtle scale down (`0.98`) on click.
  - *Secondary / Ghost:* Frosted background (`rgba(115, 103, 240, 0.08)`), text `#7367F0`, hover state switches to `rgba(115, 103, 240, 0.15)`.
- **Cards & Bento Units:**
  - Crisp boundary lines with hair-thin borders, internal padding of 20px, and subtle colored top glows when tasks or projects carry a color theme.
- **Checkboxes & Task Items:**
  - Custom 20px rounded squircle checkboxes. Unchecked: `border: 2px solid #CBD5E1`. Checked: Spring animation pop into `#34D6B0` (Fresh Mint) with a crisp white checkmark, applying a soft strikethrough and 60% opacity to task title text.
- **Chips & Tags:**
  - Soft-tinted backgrounds (12% opacity of the respective color) paired with full-strength bold text (e.g., Coral Pink tag `#FF7997` on `#FFF0F3`).
- **Circular Progress Meters:**
  - Concentric or single SVG circular stroke meters (`stroke-width: 6px`) featuring rounded line-caps, a subtle gray track (`#F1F5F9`), and active gradients transition from `#7367F0` to `#38BDF8`.
- **Kanban Columns:**
  - Headers feature high-energy colored accent bars (3px height) or matching tinted badges alongside task counter pills. Column body uses `#F1F5F9` at 50% opacity with dashed drop targets.
- **Floating Quick-Add (FAB):**
  - High-elevation pill or circular trigger fixed at bottom-right (`bottom: 2rem`, `right: 2rem`), saturated `#7367F0` fill with a prominent plus icon, transitioning into an omni-search/input command bar on press.
- **Inputs & Search:**
  - Surface `#FFFFFF`, border `1.5px solid #E2E8F0`, smooth transition to `#7367F0` with a 3px outer glow (`rgba(115, 103, 240, 0.15)`) on focus.