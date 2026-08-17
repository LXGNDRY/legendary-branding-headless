# Hanssen Design System

> Editorial luxury streetwear — off-white canvas, serif headlines, accent red CTAs, Inter body.
> Inspired by the Hanssen Framer template.

---

## 1. Foundations

### Typography

| Token | Value | Usage |
|---|---|---|
| `--font-serif` | `'Instrument Serif', Georgia, 'Times New Roman', serif` | Display headings, logo, product titles |
| `--font-sans` | `'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif` | Body, UI, buttons, labels |
| `--font-display` | `var(--font-serif)` | Heading default |
| `--font-body` | `var(--font-sans)` | Body default |
| `--font-mono` | `'Menlo', 'Consolas', monospace` | Timer numbers, code |

**Type Scale:**
| Token | Value | Element |
|---|---|---|
| `--text-display-1` | `clamp(3.5rem, 8vw, 7rem)` | Hero / page title (h1) |
| `--text-display-2` | `clamp(2.5rem, 5vw, 4.5rem)` | Section heading (h2) |
| `--text-display-3` | `clamp(1.75rem, 3.5vw, 2.75rem)` | Sub-section / card heading (h3) |
| `--text-heading-1` | `1.75rem` | UI heading (h4) |
| `--text-body-lg` | `1.125rem` | Lead paragraph |
| `--text-body` | `1rem` | Body text |
| `--text-small` | `0.875rem` | Secondary text |
| `--text-caps` | `0.75rem` | Eyebrow labels, button text |

**Heading rules:** `font-weight: 400` (serif is never bold), `line-height: 1.1`, `letter-spacing: -0.01em`.

---

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-offwhite` | `#FAF9F6` | Primary background (canvas) |
| `--color-offblack` | `#1A1A1A` | Primary text, dark sections |
| `--color-accent` | `#FF3B30` | Buttons, badges, focus rings, hotspots |
| `--color-accent-hover` | `#E0342A` | Button hover state |
| `--color-background` | `#FAF9F6` | Page background |
| `--color-foreground` | `#1A1A1A` | Default text |
| `--color-text-secondary` | `#6B6B6B` | Secondary text, muted labels |
| `--color-text-inverse` | `#FAF9F6` | Text on dark backgrounds |
| `--color-border-subtle` | `#E8E6E1` | Dividers, borders |
| `--color-border-strong` | `#1A1A1A` | Strong borders |
| `--color-surface` | `#F3F2EE` | Card surfaces, subtle backgrounds |
| `--color-sale` | `#FF3B30` | Sale badges |

**Legacy aliases** (kept for backwards compat): `--color-canvas`, `--color-ink`, `--color-muted`, `--color-subtle`, `--color-border`, `--color-shadow`

---

### Spacing

**Scale:** `--space-1` (4px) → `--space-11` (160px), steps double roughly every 3 levels.

**Section padding:**
| Token | Value |
|---|---|
| `--section-padding-y` | 96px (mobile default) |
| `--section-padding-y-md` | 128px (tablet) |
| `--section-padding-y-lg` | 160px (desktop) |
| `--section-padding-y-mobile` | 64px |
| `--spacing-page-x` | `clamp(1rem, 4vw, 2.5rem)` |

---

### Radius & Effects

| Token | Value |
|---|---|
| `--radius-xs` | 2px |
| `--radius-sm` | 4px |
| `--radius-md` | 6px |
| `--radius-lg` | 12px |
| `--radius-pill` | 999px |

Hanssen uses **no rounded corners on images** by default — images are flush rectangles. Cards and sections have no visible border radius (invisible edges).

---

### Animation

| Token | Value |
|---|---|
| `--ease-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Primary easing (signature Hanssen feel) |
| `--ease-quart` | `cubic-bezier(0.76, 0, 0.24, 1)` | Secondary ease |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Material-style standard |
| `--duration-fast` | 150ms |
| `--duration-base` | 200ms |
| `--duration-slow` | 400ms |
| `--duration-reveal` | 600ms |

**Accessibility:** All animations respect `prefers-reduced-motion`. Reveal elements are forced to `opacity: 1` with no transition.

---

## 2. Utility Classes

All prefixed with `h-` (Hanssen). Defined in `app/styles/app.css`.

### Layout

| Class | Purpose |
|---|---|
| `.h-section` | Standard section vertical padding (responsive: 64px mobile → 160px desktop) |
| `.h-container` | Max-width 1440px, centered, horizontal page padding |
| `.h-bleed` | Full-bleed wrapper (edge-to-edge) |
| `.h-section-header` | Flex layout for section titles: eyebrow + heading on left, link on right |

### Typography

| Class | Purpose |
|---|---|
| `.h-eyebrow` | Caps label — Inter, 0.75rem, 500 weight, 0.15em tracking, uppercase, secondary color |

### Buttons

| Class | Variant |
|---|---|
| `.h-btn-primary` | Solid red background, white text, pill shape, hover lift |
| `.h-btn-outline` | Transparent with dark border, dark text, pill shape, fills on hover |

### Links

| Class | Purpose |
|---|---|
| `.h-link` | Text link with underline slide-on-hover animation |

### Reveal Animations

| Class | Purpose |
|---|---|
| `.h-reveal` | Base reveal — starts at `opacity: 0, translateY(20px)` |
| `.h-reveal.is-visible` | Activated by `useReveal` hook — fades + slides in |
| `.h-reveal-img` | Image variant — starts at `scale(0.97)`, scales to 1 |
| `.h-stagger` | Parent — children get staggered transition-delay (0 → 350ms, 50ms steps) |

Usage: add `.h-reveal` + `useReveal()` hook to the element.

### Marquee Animations

| Keyframe | Purpose |
|---|---|
| `h-marquee-scroll` | Horizontal marquee scroll (for BrandMarquee) |
| `h-announce-scroll` | Horizontal scroll (for AnnouncementBar) |
| `h-hero-zoom` | Slow subtle zoom (hero image ken-burns effect) |

---

## 3. Component Reference

### Layout Components

#### Header
- **File:** `app/components/layout/Header.tsx`
- Sticky, scroll-triggered backdrop blur + bottom border
- Desktop: 5 nav links (New, Shop, Lookbook, Journal, About) with mega dropdown
- Mobile: hamburger → full-screen menu with serif display links + stagger animation
- Right side: wishlist icon + cart icon with badges

#### Footer
- **File:** `app/components/layout/Footer.tsx`
- Top row: serif brand wordmark + newsletter signup
- 3 columns: Shop / Info / Legal
- Bottom bar: copyright + social links
- Light background (`#FAF9F6`), `#E8E6E1` borders

#### AnnouncementBar
- **File:** `app/components/layout/AnnouncementBar.tsx`
- Dark background, infinite horizontal scroll
- Inter caps text, red star separators

#### CartDrawer
- **File:** `app/components/layout/CartDrawer.tsx`
- Slide-in from right, overlay backdrop
- Cart items, subtotal, checkout button

#### MobileMenu
- **File:** `app/components/layout/MobileMenu.tsx`
- Full-screen overlay, serif display nav links
- Staggered entrance animation

### Section Components

All section components follow the same pattern:
- Accept `eyebrow` + `heading` props
- Use `.h-section` + `.h-container` + `.h-section-header`
- Include `.h-reveal` for scroll animation

| Component | Props | Purpose |
|---|---|---|
| `HeroSplit` | eyebrow, heading, body, image, ctaLabel, ctaLink | Split-screen hero (2fr / 1fr) |
| `CategoryGrid` | eyebrow, heading, linkLabel, linkUrl, categories, columns | 2/3/4 column category cards |
| `NewArrivalsGrid` | eyebrow, heading, linkLabel, linkUrl, products, columns | Product grid with asymmetric first item |
| `EditorialBand` | eyebrow, heading, body, image, imagePosition | Image + text split section |
| `NewsletterBand` | heading, body, buttonLabel | Full-width dark newsletter signup section |
| `BrandMarquee` | items, style (editorial/bold/minimal), speed, direction, showIcon | Infinite scrolling text strip |
| `BrandStory` | eyebrow, heading, body, image, imagePosition, buttonLabel, buttonLink | Brand story split section |
| `CollectionGrid` | eyebrow, heading, linkLabel, linkUrl, collections, columns | Editorial collection cards |
| `Lookbook` | eyebrow, heading, linkLabel, linkUrl, items, gridStyle | Asymmetric grid with product hotspots |
| `Testimonials` | eyebrow, heading, items (quote, name, location, stars) | 3-column quote cards on dark bg |
| `StatStrip` | stats (value, label), variant (light/dark) | Horizontal stat row with serif numbers |
| `DropTimer` | eyebrow, heading, description, dropDate, buttonLabel, buttonLink, backgroundImage, productImage | Countdown timer section on dark bg |
| `BeforeAfter` | eyebrow, heading, beforeImage, afterImage, beforeLabel, afterLabel | Drag-to-compare image slider |
| `FitCheck` | eyebrow, heading, image, hotspots (x, y, label, product) | Full-width image with clickable product hotspots |
| `NewsletterPopup` | (none — configured via constants) | Timed newsletter signup modal |

### UI Components

| Component | Props | Purpose |
|---|---|---|
| `ProductCard` | product, showBadge, showQuickAdd, showWishlist, variant | Product card with hover zoom, quick-add, wishlist heart |
| `Badge` | label, variant (sale/new/soldout) | Pill-shaped badge (red sale variant) |
| `Button` | children, variant (primary/outline/ghost), size (sm/md/lg), as (button/link), to | Reusable button |
| `Container` | className, children | Max-width container wrapper |
| `HeroPlaceholder` | variant (editorial/street) | CSS/SVG placeholder when hero image missing |
| `ProductGallery` | images, onSelect | PDP image gallery with thumbnails |
| `RecentlyViewed` | products | Recently viewed products row |
| `WishlistButton` | productId, productHandle | Heart icon wishlist toggle |
| `SearchTypeahead` | (search query) | Predictive search dropdown |
| `SizeGuideModal` | open, onClose | Size guide modal |
| `WaitlistForm` | productId | Out-of-stock waitlist signup |
| `CurrencySwitcher` | (none) | Currency selector dropdown |

### Hooks

| Hook | File | Purpose |
|---|---|---|
| `useReveal()` | `app/hooks/useReveal.ts` | IntersectionObserver hook — adds `.is-visible` when element enters viewport |

---

## 4. Homepage Section Order (current)

1. `HeroSplit` — Main editorial hero
2. `BrandMarquee` — Editorial wordmark scroll
3. `CategoryGrid` — 3-up categories
4. `NewArrivalsGrid` — Asymmetric product grid
5. `EditorialBand` — Image + text band
6. `StatStrip` — Stats row
7. `Testimonials` — Customer reviews
8. `NewsletterBand` — Dark newsletter CTA

---

## 5. Usage Guidelines

### When to use `h-` vs inline Tailwind
- Use `h-` utility classes for **design-system patterns** (buttons, sections, links, eyebrows)
- Use inline Tailwind utilities for **one-off layout adjustments** (margins, gaps, flex configs)
- Never hardcode hex colors — use CSS variables or the `bg-[#HEX]` pattern for one-offs
- Product images: **no border radius** (flush rectangle), with `transition-transform` hover zoom

### Adding a new section
1. Create in `app/components/sections/MyNewSection.tsx`
2. Use `.h-section` + `.h-container` + `.h-section-header` as the base
3. Add `.h-reveal` for entrance animation
4. Use `h-eyebrow` for section labels, serif `h2` for headings
5. Export default and import into the homepage route

### Responsive approach
- Mobile-first: base styles = mobile
- `md:` breakpoint = 768px
- `lg:` breakpoint = 1024px
- Use `clamp()` for fluid typography and spacing

---

## 6. Legacy (`lb-`) Classes

These are preserved as shims in `app.css` to prevent breaking during the transition:

| Legacy class | Hanssen equivalent |
|---|---|
| `.lb-eyebrow` | `.h-eyebrow` |
| `.lb-section` | `.h-section` |
| `.lb-container` | `.h-container` |
| `.lb-section-header` | `.h-section-header` |
| `.lb-section-header__link` | `.h-link` |

**All new code should use `h-` classes.** `lb-` shims will be removed in a future cleanup.
