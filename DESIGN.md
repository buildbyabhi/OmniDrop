# OmniDrop Design System (Cinematic Neumorphism)

This UI aims to replicate the highly satisfying, physical, and premium feel of cinematic streaming apps (like Netflix) combined with tactile hardware interfaces.

## 1. Core Principles
- **Cinematic Canvas:** Deep black/grey background (`#141414`).
- **Tactile Neumorphism:** UI elements aren't just flat rectangles. They are physical buttons extruded from the background using double-box shadows (one light, one dark). When clicked/active, they invert to inset shadows to mimic physical depression.
- **Netflix Red:** The iconic `#E50914` is used for glowing accents, loading spinners, and progress indicators.
- **Micro-Interactions:** Movie-card style hovers. Cards scale up to `1.05` and cast a heavy shadow to pop out from the screen.

## 2. Color Palette
- **Background:** `#141414` (Netflix Base Dark)
- **Primary Text:** `#FFFFFF` (High contrast headings)
- **Secondary Text:** `#808080` & `#B3B3B3` (Cinematic muted grays)
- **Accent:** `#E50914` (Netflix Red)

## 3. Typography
- **Font Family:** `Inter`, with extreme font weights (Black `800` for headers) and tight letter spacing to mimic cinematic title cards.

## 4. Satisfying Feedback
- **Hardware Feel:** The upload zone uses the `.neu-outset` and `.neu-inset` classes to provide a physical "click" feeling when you drop a file.
- **Hover States:** Links and buttons have a smooth, slow easing (`cubic-bezier(0.25, 0.46, 0.45, 0.94)`) to make the interface feel substantial and "heavy", unlike fast, jittery web animations.
