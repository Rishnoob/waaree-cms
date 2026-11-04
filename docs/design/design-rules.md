# Waaree design rules

Extracted on 2026-10-30 from **waaree.com**'s live CSS plus the screenshots in [screenshots/](screenshots/). These rules become the tokens in `waaree-web/src/styles/tokens.css`. **Change a rule here and in tokens.css together.**

> waaree.com is built on **Next.js** (Bootstrap-style theme, Poppins), the same framework we use.

---

## 1. Colors

### Brand
| Token | Value | Source | Use |
|---|---|---|---|
| `brand-green` | `#0db02b` | `--theme-primary` | Brand moments: icons, borders, active states, gradients, focus ring, large shapes |
| `brand-blue` | `#28a9e2` | `--theme-secondary` | Second accent: category labels ("Blog"), gradient end, info |
| `brand-gradient` | `linear-gradient(270deg, #0db02b, #28a9e2)` | `--theme-gradient` | Signature accent: hero highlights, progress bars, special badges |
| `brand-tint` | same gradient at 10% opacity | site cards | Soft card backgrounds (investor PDF cards) |

### Accessible variants (our decision)
Waaree's green and blue are **too light for text or white-on-color buttons** under WCAG AA (4.5:1):

| Color on white | Contrast | AA text? |
|---|---|---|
| `#0db02b` brand green | 2.89 | ❌ |
| `#28a9e2` brand blue | 2.67 | ❌ |
| **`#0a8a22` primary** (darker green) | 4.50 | ✅ |
| **`#087f1e` primary-strong** | 5.17 | ✅ |
| **`#16729e` info** (darker blue) | 5.34 | ✅ |

So:
- **Buttons, links and green text** use `primary` / `primary-strong`. They look almost the same as the brand but pass AA.
- **Brand green and blue** stay for icons, borders, fills behind dark text, and gradients.

### Neutrals
| Token | Value | Source | Use |
|---|---|---|---|
| `foreground` | `#454242` | `--theme-text-color` | Headings, strong text |
| `body` | `#5b5b5b` | `--theme-body-color` | Body text (6.8:1) |
| `muted` | `#8a8a8a` | — | Secondary text, meta (dates) |
| `placeholder` | `#aeaeae` | site inputs | Input placeholders only |
| `border` | `#e0e0e0` | site | Dividers, neutral borders |
| `surface` | `#ffffff` | — | Cards, page |
| `surface-muted` | `#f7f7f7` | site | Section backgrounds |
| `dark-blue` | `#2c3e50` | `--theme-dark-blue` | Rare dark accents |

### Status (CMS)
success = primary green · info = `#16729e` · warning `#b45309` · danger `#c62828`

### Dark mode (CMS only, our addition)
waaree.com has no dark mode. The CMS gets one: near-black green-tinted surfaces (`#0f1514`), light text (`#ececec`), a brighter green (`#22c55e`) for contrast. **The public site stays light**, to match waaree.com.

---

## 2. Typography

- **Font: Poppins** (Google font), the same as waaree.com. Weights used: **300, 400, 500, 600** (700 rarely).
- **Hero headings use weight 300 (light) and are very large** ("Accelerating Global Energy Transition"). This light, airy feel is a key part of the brand.
- Section and card titles: weight 500–600, colored `foreground`.
- Body: 16px / 1.5 line-height, weight 400, colored `body`.
- Scale (rem): 0.75 · 0.875 · 1 · 1.125 · 1.25 · 1.5 · 2 · 2.5 · 3.5 · 4.5.

## 3. Shape

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 8px | Small chips, checkboxes |
| `radius` | **10px** | Inputs, dropdowns, small cards (most used on the site) |
| `radius-lg` | **20px** | Cards, images, panels |
| `radius-full` | 9999px | **Buttons are pills**, icon buttons are circles |

## 4. Depth & motion

| Token | Value |
|---|---|
| `shadow-soft` | `0 5px 40px rgba(0,0,0,.05)` (cards at rest) |
| `shadow` | `0 4px 14px rgba(0,0,0,.10)` (raised, hover) |
| `shadow-lg` | `0 4px 34px rgba(0,0,0,.10)` (modals, popovers) |
| `ease` | `300ms ease-in-out` (the site's default transition) |

Always respect `prefers-reduced-motion`.

## 5. Signature components (from the screenshots)

| Pattern | Look |
|---|---|
| **Primary button** | Green (v2: sharp 8px corners, not a pill), white text weight 500, **circle-arrow icon (→ in a ring) on the left**. Used for "Explore More", "Download Now", "DMS" |
| **Icon button** | Solid green circle, white line icon (cart, search, menu) |
| **Input / select** | White, **1px green border**, radius 10px, grey placeholder, **green chevron**, green search icon on the left |
| **Segmented tabs** | Outlined pill container; active segment is a solid green fill ("Upcoming / Past-Events") |
| **Content card** | Image with radius 20px on top → meta row (colored category label + date) → title (600) → excerpt (body) |
| **Event card** | Image → green icon meta row (📅 date · 🕐 time · 📍 location) → title → description → "Event Type" icon list |
| **Document card** | Soft green-blue tint background, radius 20px, white circle holding a gradient PDF icon, centered title, "Download Now" pill |
| **Stats row** | Line icon + big number (light weight) + two-line label, separated by thin vertical dividers ("25.8 GW Solar Module Manufacturing") |
| **Filters bar** | A row of outlined selects + date picker + wide search, all the same height |
| **Header** | White, logo left, text nav with chevrons, green pill/circle actions on the right |
| **Background decor** | Very light green→blue wash and **faint thin concentric circle lines** behind sections |

## 6. Imagery & tone
- Real photography: factories, solar panels, events, people. Large, with rounded corners.
- Line icons (thin stroke, green or gradient).
- Copy: confident, short, optimistic ("Cleaner, brighter future, one Renewable Energy solution at a time.").

## 7. How this applies

- **Public site blocks** match waaree.com closely (same font, colors, shapes, patterns above), so CMS-built pages feel native on their domain.
- **The CMS admin** uses the same brand tokens but leans more **minimal and futuristic**:
  - more whitespace, neutral surfaces, and green used sparingly as the accent;
  - the gradient kept for special moments (publish success, AI features);
  - dark mode included.

---

## 8. Design language v2: modern, minimal, still Waaree (2026-10-30)

**Goal:** a new-age, minimal UI that still feels like waaree.com. What stays fixed: **Poppins**, **brand green `#0db02b` / blue `#28a9e2`**, the **green→blue gradient**, **warm-grey text** (`#5b5b5b` body), **pill buttons with the circle-arrow**. What v2 changes: how calm, deep and soft everything feels.

| Principle | Rule |
|---|---|
| **Inset layout** | The app sits on a soft `canvas` (`#f3f6f4`). The sidebar rests on the canvas, and each screen lives in one floating `surface` panel (radius-xl, hairline border, soft shadow) with a **glass top bar** (`bg-surface/80 backdrop-blur-xl`) |
| **Hairlines over fills** | Cards, tables and inputs use a 1px `border` / `border-strong` plus a very soft layered shadow. No heavy outlines, no grey boxes |
| **Neutral at rest, brand on intent** | Inputs and secondary buttons are neutral grey at rest. Green appears on hover/focus (`hover:border-brand-green/50`, `focus:shadow-glow`). Solid green is for the main action only |
| **Gradient = accent, never a wallpaper** | Use `--brand-gradient` for small things: the active-nav indicator, the "CMS"/"New" badges, highlighted words, avatars. Use `--brand-mesh` only for hero/brand panels |
| **Type** | Big **light (300)** headings with tight tracking; small **uppercase tracked** labels (`text-[0.6875rem] tracking-wider`); body at 1.55 line-height; `text-wrap: balance` on headings |
| **Shape** | Tight, engineered radii: 4 (sm: badges, chips, tab items) · 8 (md: buttons, inputs, menu items) · 12 (lg: cards, nav bar) · 16 (xl: panels, dialogs). **No pills** for buttons or badges. Circles only for points: map pins, avatars, status dots. The switch keeps its pill (universal toggle shape) |
| **Depth** | `shadow-soft` (rest) → `shadow-md` (hover) → `shadow-lg` (popovers, dialogs). Shadows are tinted green-black, never pure black |
| **Motion** | 200 ms, `cubic-bezier(.2,.8,.2,1)`. Cards lift 2px on hover; primary buttons lift 1px and press to 97%; dialogs scale in; menus fade; the mobile menu slides. All of it is off under `prefers-reduced-motion` |
| **Focus** | Every interactive element shows `shadow-glow` (a soft green ring) on keyboard focus |
| **Dark mode** | CMS only, via the top-bar toggle (remembered per browser, applied before paint). The public site stays light like waaree.com |

New tokens: `canvas`, `border-strong`, `radius-xl`, `glow`, `brand-mesh`, animations `fade-in` · `dialog-in` · `sheet-in` · `rise-in`.

**Rule for new pages:** build only from `components/ui` + tokens. If a new screen needs a new look, add it to the UI kit first, so every page keeps feeling like one website.
