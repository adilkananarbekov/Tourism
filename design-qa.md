# 404 page design QA

## Evidence

- Source visual truth: two local reference images (primary composition and quick-link reference), not in the repository.
- Browser-rendered implementation: `.codex-qa/404-desktop-passed.png`.
- Mobile implementation: `.codex-qa/404-mobile-ru-passed.png`.
- Side-by-side comparison: `.codex-qa/404-comparison-passed.png`.
- Source pixels: 1672 x 941. Desktop implementation pixels/CSS viewport: 1650 x 843 at deviceScaleFactor 1. The desktop capture was scaled proportionally to 1672 px wide and centered on a 1672 x 941 comparison frame. Mobile pixels/CSS viewport: 390 x 844 at deviceScaleFactor 1.
- State: anonymous visitor with analytics declined, English desktop and Russian mobile, unknown public URL.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Typography: the implementation uses the site's existing font and weight system rather than copying a foreign font, while preserving the reference hierarchy, compact heading line-height, small 404 eyebrow, and readable support copy.
- Spacing/layout: the final card is intentionally slightly wider than the primary reference to include the quick-link navigation from the second reference. Desktop alignment, section rhythm, radii, and responsive stacking remain balanced; the 390 px viewport has no horizontal overflow.
- Colors/tokens: the dark olive card, muted green action, warm copper accents, white hierarchy, and dimmed photographic background match the references while staying consistent with the live site's palette.
- Image quality: the existing high-resolution Kyrgyzstan canyon image is used as the backdrop. The compass is a native SVG instrument with mathematically clean rings, a 48-tick bearing scale, cardinal points, topographic route lines, and a separately animated needle—there is no cropped raster outline.
- Copy/content: English and Russian variants are concise and route users toward a useful next action. Search, home, tours, gallery, and contact destinations are explicit.
- Focused-region comparison was not required because the desktop side-by-side evidence keeps the compass, title, search controls, and quick links readable at full-view scale. The separate mobile capture verifies the responsive state.
- Acceptable P3 differences: the live site's floating contact buttons remain visible on desktop, and the decorative dotted route is omitted to avoid adding non-functional visual weight.

## Interaction and runtime checks

- Search submitted `Song Kul` and navigated to `/tours?q=Song%20Kul`.
- Quick links resolved to `/`, `/tours`, `/gallery`, and `/feedback`.
- Russian unknown route rendered Russian copy at 390 x 844.
- Browser runtime exceptions: none.
- Mobile horizontal overflow: none (`body.scrollWidth` = 390).
- `npm run check`: passed, including typecheck, backend syntax, production build, and 102-route SEO output verification.

## Comparison history

1. Initial render exposed a P0 route placement error: the wildcard route was accidentally nested under the admin guard and showed Admin Sign In. The wildcard was moved under the public SiteLayout; post-fix browser evidence shows the intended 404 page with the public header and footer.
2. Initial visual pass found a P2 fidelity issue: the compass was approximated with a library icon and the card was wider than the reference. The card width was reduced from `max-w-6xl` to `max-w-5xl`; the final compass is a custom SVG rather than a cropped image, so its circular outline remains exact at every breakpoint.

## Final result

final result: passed

---

# Neutral green 60/30/10 local redesign QA — 2026-09-03

## Evidence

- Baseline mobile hero: `.codex-qa/neutral-green-60-30-10/before-mobile-dark.png`.
- Final mobile hero: `.codex-qa/neutral-green-60-30-10/after-mobile-dark.png`.
- Same-state comparison: `.codex-qa/neutral-green-60-30-10/before-after-mobile.png`.
- Route contact sheets: `mobile-dark-contact-sheet.jpg` and `mobile-light-contact-sheet.jpg` in the same QA directory.
- Focused form captures: `feedback-mobile-light-final.png` and `ru-feedback-mobile-light-final.png`.
- State: local development build, 454 x 544 captured viewport, English and Russian, light and dark themes. No server deployment was performed.

## Findings

- Visual hierarchy now follows the requested 60/30/10 direction: off-white/white and near-black carry the surfaces and text; green is limited to navigation state, focus, small labels, rules, icons, and conversion actions.
- The previous coral, cyan, and navy literals were removed from active public UI, loading shell, theme metadata, and favicon. Red remains reserved for validation and destructive states.
- Barlow Condensed and global uppercase were removed from the public presentation. Lora 600–700 is self-hosted with Latin, Cyrillic, and Cyrillic Extended subsets for stable EN/RU rendering; system sans handles navigation, body copy, forms, and controls; Outfit remains limited to the Latin brand lockup.
- Large headings use sentence case, balanced wrapping, and safer mobile line-height. The long English and Russian request headings received a dedicated mobile scale, reducing the wall-of-text effect without changing their copy.
- Natural photographs are not colorized. The hero uses neutral black shading, white text, and one restrained green underline so the photography remains the emotional color source.
- Footer, floating contacts, CTA bands, destination heroes, gallery video action, tabs, form focus states, and the animated 404 compass now share the same black/white/green language.
- The `.admin-shell` token block was kept unchanged.
- Checked public routes have no horizontal overflow and no broken visible images at the captured mobile viewport.

## Interaction and runtime checks

- Mobile navigation opened and exposed destination, seasonal trip, guide, gallery, language, theme, and request actions.
- Light and dark theme choices changed the root palette correctly.
- Homepage season selection changed from September to October and updated the seasonal heading.
- 404 search with `Song Kul` navigated to `/tours?q=Song%20Kul`.
- Lora reported loaded for both English and Russian headings through `document.fonts.check`.
- Core palette contrast passed WCAG AA: light green CTA 6.34:1, dark-theme green 8.02:1, light secondary copy 5.56:1, and dark secondary copy 9.31:1.
- `npm run typecheck`: passed.
- `npm run build`: passed; 109 canonical routes, 39 tours, 12 blogs, and 3 destinations generated and verified.

## Final result

final result: passed locally; awaiting visual approval before deployment

---

# Site-wide coral / navy redesign QA — 2026-08-27

## Evidence

- Source visual truth: a generated concept image (kept locally, not in the repository).
- Final homepage capture: `.codex-qa/redesign-sitewide/implementation-dark-1440.png`.
- Same-input comparison: `.codex-qa/redesign-sitewide/comparison-dark-1440.png`.
- Route captures: `tours-winter-1440.png`, `tour-detail-1440.png`, `blogs-1440.png`, `best-time-1440.png`, `gallery-1440.png`, `feedback-1440.png`, `song-kul-1440.png`, `privacy-1440.png`, and `404-1440.png` in the same QA directory.
- Mobile captures: English home, menu, tours, and feedback plus Russian home, feedback, and tour detail at 390 x 844.
- Desktop state: dark theme at 1440 x 1024. Mobile state: dark theme at 390 x 844.

## Findings

- No actionable P0, P1, or P2 visual differences remain.
- The selected condensed editorial typography, graphite/navy surfaces, coral conversion color, cyan seasonal accent, squared controls, thin rules, photographic scale, and compact brand lockup now carry across the public site.
- Tours, tour detail, editorial guides, gallery, request flow, destination hubs, legal pages, footer, floating contacts, and 404 use the same surface geometry and interaction language.
- The public logo is a responsive `kyrgyz.tours` lockup built from the existing Lucide mountain icon system; favicon and initial loading shell use the same coral/navy identity.
- English and Russian long headings remain readable. All checked routes have zero horizontal overflow and zero broken visible images at desktop and mobile widths.
- Floating contact buttons start at the desktop breakpoint and are omitted on request and legal routes, preventing overlap with the mobile sticky lead bar and the request form.
- The loading shell now matches the live theme, so there is no old green flash or unstyled text exposure before React is ready.

## Interaction and runtime checks

- Mobile navigation opens, exposes every expected action, navigates to `/tours`, and closes after the route change.
- Season and month controls expose selected state; the homepage defaults to the upcoming travel season instead of being permanently fixed to September.
- Gallery video replaces its poster with a playable local video (`readyState` 4). “Load more photos” increased the stable masonry grid from 12 to 24 items and preserved scroll position (`deltaScroll` 0 with a real pointer click).
- Feedback routes render without floating-contact overlap. No request was submitted during QA.
- Fresh console session: zero errors; only the two known React Router v7 opt-in notices remain.
- TypeScript check, backend syntax check, production Vite build, SEO HTML generation, and SEO output validation passed.
- SEO output: 109 canonical routes, 39 tours, 12 blog posts, and 3 destination hubs.
- Frontend release `20260827-021841` passed live HTTPS smoke and visual checks; `/health` stayed healthy and the backend release was not changed.

## Final result

final result: passed

## Animation update — 2026-08-14

- The native SVG has no image dependency: its geometry includes two circular rings, 48 bearing ticks, four cardinal directions, topographic path details, and a layered brass needle.
- The needle moves independently through a restrained 9-second route-search motion; the dial drifts by less than one degree, while the halo and pivot breathe at separate intervals. The effect uses CSS transforms and opacity only.
- Browser evidence confirms one SVG compass, zero raster images inside it, all four cardinal directions, a changing needle transform, and no horizontal overflow.
- `prefers-reduced-motion: reduce` disables all four compass animations. The Russian mobile page at 390 x 844 has no horizontal overflow.

---

# Coral seasonal homepage redesign QA — 2026-08-26

## Evidence

- Source visual truth: a generated concept image (kept locally, not in the repository).
- Desktop implementation: `.codex-qa/redesign-concepts/implementation-dark-1440.png`.
- Mobile implementation: `.codex-qa/redesign-concepts/implementation-dark-mobile-390.png`.
- Side-by-side comparison: `.codex-qa/redesign-concepts/comparison-dark-1440.png`.
- Reference state: coral dark concept, 1487 x 1058 pixels. Implementation state: English homepage, dark mode, 1440 x 1024 CSS viewport; mobile state: 390 x 844.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Visual identity: the implementation preserves the reference's deep graphite/navy field, coral conversion color, cool cyan seasonal accent, condensed editorial display type, squared controls, panoramic mountain photography, and four-tab season selector.
- Source adaptation: the implementation uses real photographs and real tour data already stored in the project. This deliberately replaces generated reference landscapes and placeholder route names without changing the selected art direction.
- Layout: the desktop hero mirrors the reference's two-line white/cyan headline system, edge-to-edge mountain image, compact overlay header, seasonal rail, asymmetric route grid, and four-part trust strip. Mobile stacks without horizontal overflow and keeps both primary actions visible above the fold.
- Theme system: the new coral/navy tokens work in light and dark modes; the admin-specific token scope remains unchanged.
- Localization: English and Russian homepages share the same seasonal component, localized copy, links, route titles, tabs, and reassurance labels.
- Accessibility: tabs expose tab semantics and selected state, interactive elements have visible focus styles, imagery has localized alt text, and motion respects reduced-motion preferences.
- Acceptable P3 differences: the production UI retains the existing floating WhatsApp/Telegram controls and includes an explanatory paragraph plus a secondary CTA, both of which support the site's real conversion flow.

## Interaction and runtime checks

- Season tabs changed the selected state and updated the heading and real tour selection; October returned three season-ranked routes.
- Light and dark theme choices changed the root theme and body colors correctly.
- Mobile navigation opened and exposed all expected navigation, language, theme, and trip-planning controls.
- English and Russian homepages rendered the localized seasonal experience with no browser runtime errors.
- Fresh browser session: zero console errors; two pre-existing React Router v7 migration warnings only.
- `npm run typecheck`: passed.
- `npm run build`: passed; 109 canonical SEO routes generated and verified.

## Comparison history

1. The first implementation used an oversized hero title that wrapped into four lines and pushed the seasonal rail below the reference position. The title scale, hero height, and vertical spacing were tightened.
2. The heading was then split into a white lead and cyan accent to reproduce the reference's three-line editorial rhythm on desktop while retaining a readable mobile stack.
3. A React warning caused by an unsupported `fetchPriority` prop was removed from the new hero. A fresh browser run confirmed zero runtime errors.

## Final result

final result: passed
