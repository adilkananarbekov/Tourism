# 404 page design QA

## Evidence

- Source visual truth: `C:\Users\user\AppData\Local\Temp\codex-clipboard-f58f146c-3c19-4b82-aba9-570bfa8c3924.png` (primary composition) and `C:\Users\user\AppData\Local\Temp\codex-clipboard-41ee9531-64f1-49d3-84da-e869d7a77d67.png` (quick-link reference).
- Browser-rendered implementation: `C:\Users\user\Documents\kyrgyz.tours\source_code\.codex-qa\404-desktop-passed.png`.
- Mobile implementation: `C:\Users\user\Documents\kyrgyz.tours\source_code\.codex-qa\404-mobile-ru-passed.png`.
- Side-by-side comparison: `C:\Users\user\Documents\kyrgyz.tours\source_code\.codex-qa\404-comparison-passed.png`.
- Source pixels: 1672 x 941. Desktop implementation pixels/CSS viewport: 1650 x 843 at deviceScaleFactor 1. The desktop capture was scaled proportionally to 1672 px wide and centered on a 1672 x 941 comparison frame. Mobile pixels/CSS viewport: 390 x 844 at deviceScaleFactor 1.
- State: anonymous visitor with analytics declined, English desktop and Russian mobile, unknown public URL.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Typography: the implementation uses the site's existing font and weight system rather than copying a foreign font, while preserving the reference hierarchy, compact heading line-height, small 404 eyebrow, and readable support copy.
- Spacing/layout: the final card is intentionally slightly wider than the primary reference to include the quick-link navigation from the second reference. Desktop alignment, section rhythm, radii, and responsive stacking remain balanced; the 390 px viewport has no horizontal overflow.
- Colors/tokens: the dark olive card, muted green action, warm copper accents, white hierarchy, and dimmed photographic background match the references while staying consistent with the live site's palette.
- Image quality: the existing high-resolution Kyrgyzstan canyon image is used as the backdrop. The compass is an exact raster extraction from the supplied reference rather than a code-drawn approximation.
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
2. Initial visual pass found a P2 fidelity issue: the compass was approximated with a library icon and the card was wider than the reference. The exact compass artwork was extracted from the supplied reference and the card width was reduced from `max-w-6xl` to `max-w-5xl`. The final side-by-side capture confirms the corrected proportions and asset fidelity.

## Final result

final result: passed
