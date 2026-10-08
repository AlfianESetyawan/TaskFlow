---
name: Kinetic Clarity Dark
colors:
  surface: '#10141a'
  surface-dim: '#10141a'
  surface-bright: '#353940'
  surface-container-lowest: '#0a0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#262a31'
  surface-container-highest: '#31353c'
  on-surface: '#dfe2eb'
  on-surface-variant: '#c9c4d5'
  inverse-surface: '#dfe2eb'
  inverse-on-surface: '#2d3137'
  outline: '#928f9f'
  outline-variant: '#474553'
  surface-tint: '#c7bfff'
  primary: '#c7bfff'
  on-primary: '#2c0c96'
  primary-container: '#8e80fc'
  on-primary-container: '#25008c'
  inverse-primary: '#5b4bc5'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#40deb7'
  on-tertiary: '#00382c'
  tertiary-container: '#00a484'
  on-tertiary-container: '#003025'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5deff'
  primary-fixed-dim: '#c7bfff'
  on-primary-fixed: '#180065'
  on-primary-fixed-variant: '#4330ac'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#64fbd3'
  tertiary-fixed-dim: '#40deb7'
  on-tertiary-fixed: '#002018'
  on-tertiary-fixed-variant: '#005140'
  background: '#10141a'
  on-background: '#dfe2eb'
  surface-variant: '#31353c'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-desktop: 2.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system blends deep obsidian developer-centric environments with tactile, futuristic productivity interfaces. Designed for high-velocity operators, engineers, and digital craftspeople, the aesthetic pairs midnight depths with precise neon kinetic accents to indicate momentum, progress, and clarity.

The visual style merges **Glassmorphism** and **Technical Minimalism**:
- Surfaces remain deeply anchored in near-black slate and obsidian tiers to eliminate eye fatigue.
- State transitions, focus rings, and focal actions ignite with sharp, luminescent spectral accents (Electric Violet, Sky Blue, Fresh Mint, Warm Amber, Coral Pink).
- Interfaces feel lightweight, precise, and instrumental, prioritizing spatial calm and information density without visual noise.

## Colors

The palette is anchored by deep obsidian baselines, structural slates, and vivid tactical accents:

### Canvas & Surface Architecture
- **Obsidian Canvas (`#0D1117`)**: Base viewport, outer workspaces, background canvas.
- **Midnight Slate Elevated (`#161B22`)**: Structural cards, navigation panels, and primary list containers.
- **Surface Highlight (`#21262D`)**: Interactive card surfaces, hover states, input interiors, and pressed backgrounds.
- **Structural Border (`#30363D`)**: Sleek, crisp 1px division lines, outer frame thresholds, and dividers.

### Kinetic Accents & Status Semantics
- **Electric Violet (`#8B7CF8`)**: Primary brand actions, focus rings, keyboard navigation milestones, and active workflows.
- **Sky Blue (`#38BDF8`)**: Secondary information highlights, active filters, links, and operational metrics.
- **Fresh Mint (`#34D6B0`)**: Completion states, positive diffs, verified checkmarks, and automated triggers.
- **Warm Amber (`#F8C65C`)**: Blocking items, medium-priority tasks, deadlines within 24 hours, and in-progress warnings.
- **Coral Pink (`#FF7997`)**: Critical issues, overdue blocks, high-friction actions, and destructive intents.

### Typography Hierarchy Contrast
- **Primary Text (`#F0F6FC`)**: 95% opacity white for utmost legibility against obsidian surfaces.
- **Secondary Text (`#8B949E`)**: Muted slate for metadata, labels, timestamps, and secondary descriptors.
- **Subtle / Ghost Text (`#484F58`)**: Watermark tokens, disabled text, and shortcut keys.

## Typography

The typographic hierarchy implements three distinct structural roles:
1. **Space Grotesk (Display & Headlines)**: Brings an authoritative, kinetic, and modern geometric presence to dashboards, list headers, and modal titles.
2. **Geist (Body & Microcopy)**: A hyper-refined neutral grotesque engineered for optimal screen reading, high-density data, task descriptions, and dynamic UI panels.
3. **JetBrains Mono (Labels, Metadata, & Shortcuts)**: Reinforces developer ergonomics and mechanical precision across task IDs, execution counters, timestamps, shortcuts, and status pills.

## Layout & Spacing

This design system uses a 12-column fluid grid system across desktop viewpoints that compresses into a dynamic 6-column grid on tablet and a single fluid column layout on mobile devices.

- **Desktop (1024px+)**: 12-column fluid container with a max width of 1440px, anchored with `2.5rem` canvas margins and `1.5rem` gutters. Multi-pane split layouts (sidebar, task stream, detail inspector) sit side-by-side.
- **Tablet (768px - 1023px)**: 6-column grid with `1.5rem` margins and `1.25rem` gutters. Sidebar collapses to a minimized icon drawer; task streams take center stage.
- **Mobile (<768px)**: Single column stack, `1rem` outer horizontal margins, and `0.75rem` internal gaps. Sidebars convert into modal bottom-sheets.
- **Vertical Rhythm**: All component spacing complies with a strict 4px/8px internal step scale (`space-xs` to `space-xl`) to preserve dense vertical cadence across lists and swimlanes.

## Elevation & Depth

Depth is established through translucent dark layers and subtle chromatic backdrops rather than muddy drop shadows.

- **Base Layer (Elevation 0)**: Obsidian `#0D1117`. Flat canvas base.
- **Card & Pane Surfaces (Elevation 1)**: Midnight Slate (`#161B22`) rendered with `rgba(22, 27, 34, 0.85)` fill, backed by `backdrop-filter: blur(12px)`. Enclosed by a 1px solid `#30363D` border.
- **Floating Modals & Flyouts (Elevation 2)**: Elevated Slate (`#21262D`) rendered at `rgba(33, 38, 45, 0.92)` with `backdrop-filter: blur(20px)`, a 1px border of `rgba(240, 246, 252, 0.12)`, and a soft ambient shadow: `0 12px 32px -4px rgba(0, 0, 0, 0.6)`.
- **Neon Luminescence / Kinetic Bloom**: Hover states and focused actions produce an inner ambient glow. Interactive cards and primary buttons project a diffused drop shadow tinted by the active accent color: `0 0 20px -4px rgba(139, 124, 248, 0.25)`.

## Shapes

The interface embraces a tight, controlled geometric language using soft corners (`roundedness: 1`):
- **Base Components**: Inputs, task pills, list items, and standard buttons utilize a `0.25rem` (4px) border-radius to preserve a clean, technical edge.
- **Cards & Modals (`rounded-lg`)**: Larger contextual panels, drop-down menus, and translucent surfaces utilize `0.5rem` (8px).
- **Workspace Panels & App Shells (`rounded-xl`)**: Top-level containers or window shells utilize `0.75rem` (12px).
- **Status Badges & Avatar Anchors**: Fully rounded circular profiles only where semantic identification is necessary.

## Components

### Buttons
- **Primary Kinetic**: Electric Violet background (`#8B7CF8`), high-contrast dark text (`#0D1117`), weight 600. On hover, background shifts to `#9D90F9` accompanied by a soft violet glow (`0 0 16px rgba(139, 124, 248, 0.4)`).
- **Secondary Ghost**: Background `rgba(33, 38, 45, 0.6)`, 1px border `#30363D`, text `#F0F6FC`. On hover, border shifts to `#8B7CF8` with subtle background brightening (`rgba(48, 54, 61, 0.8)`).
- **Destructive**: 1px border with Coral Pink accent (`rgba(255, 121, 151, 0.4)`), text `#FF7997`. Hover yields a soft crimson illumination.

### Task Cards
- Constructed with `rgba(22, 27, 34, 0.75)` surface, `1px solid #30363D` border, and `12px` backdrop blur.
- Hover transition triggers a border luminance elevation (`#8B949E`) and 1px upward kinetic translation.
- Left-side accent stripe (2px width) dynamically mapped to status: Fresh Mint (`#34D6B0`) for completed, Warm Amber (`#F8C65C`) for in-review, and Sky Blue (`#38BDF8`) for active sprint items.

### Chips & Badges
- Compact height (22px), `JetBrains Mono` font at 11px uppercase.
- Tinted translucent fills with matched neon borders: e.g., Mint Chip has `rgba(52, 214, 176, 0.12)` fill, `rgba(52, 214, 176, 0.35)` border, and `#34D6B0` text.

### Inputs & Search
- Surface: `#161B22` with inset border `#30363D`. Text is `#F0F6FC` with placeholder `#484F58`.
- Focus state eliminates standard browser outlines and applies an Electric Violet border (`#8B7CF8`) and a focused ambient ring (`0 0 0 1px #8B7CF8`).
- Inline shortcut badges (`⌘K`) nested inside right-aligned input slots using `JetBrains Mono` at `#8B949E`.

### Selection Controls (Checkboxes & Radios)
- Checkboxes: 16x16px boxes with `#21262D` background and `#30363D` border. When checked, fill transitions instantaneously to Fresh Mint (`#34D6B0`) with `#0D1117` checkmark glyph.
- Radio buttons: Identical footprint with circular geometry; selected state renders an Electric Violet outer ring and core disc.

### Lists & Tables
- Borderless rows resting over `#0D1117` canvas separated by a single 1px line of `#21262D`.
- Hover triggers background sweep to `rgba(33, 38, 45, 0.5)`. Keyboard selection highlights row via 2px Electric Violet left boundary indicator.