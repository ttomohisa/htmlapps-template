# APP_SPEC.md

This file is the product contract for the application created from this template. Replace the starter specification below before asking an LLM to build a new product.

## 1. Product identity

- **Working name:** Single HTML App Starter
- **One-sentence purpose:** Demonstrate the template's local-first, responsive, bilingual, single-file application foundation.
- **Primary users:** Developers and LLM coding agents starting a new browser utility.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. Problem and outcome

The starter must make the repository's constraints visible and testable without pretending to be a finished end-user product. A user can enter text, see basic counts, copy it, save it, and persist it locally.

A successful replacement app should state here:

- What concrete problem it solves.
- Who experiences the problem.
- What result the user gets in one session.
- Why a local single-HTML implementation is useful.

## 3. Core user flow

1. Open the page locally or through GitHub Pages.
2. Enter or paste text.
3. See character, word, and line counts update immediately.
4. Copy or download the text.
5. Reload and recover the locally saved text.

## 4. Functional requirements

- Provide a responsive text area.
- Calculate Unicode-aware character count.
- Calculate approximate word and line counts.
- Copy text with a compatibility fallback.
- Download UTF-8 plain text.
- Save the current text in local storage when available.
- Switch Japanese and English without reloading.
- Use a light-only interface; do not add a dark-mode or theme switcher.
- Expose build version, generation timestamp, and embedded dependency count.

## 5. Data and privacy

- Input text remains in browser memory and local storage.
- The app performs no runtime network request.
- There is no server-side storage, login, analytics, telemetry, or tracking.
- Download occurs only after a user action.

## 6. Non-goals

- Collaborative editing.
- Cloud synchronization.
- Rich text formatting.
- Server-side conversion.
- Account management.

## 7. UX and accessibility

- Mobile-first responsive layout from 320px upward.
- All controls have visible labels or accessible names.
- Keyboard focus is visible.
- Motion respects `prefers-reduced-motion`.
- Destructive actions are visually distinct.
- Status messages use an `aria-live` region.

## 8. Performance expectations

- Initial UI should become interactive without network access.
- Input updates should remain smooth for at least 100,000 characters on a typical desktop browser.
- Avoid rebuilding large DOM sections on every keystroke.

## 9. Browser target

Current stable desktop and mobile versions of Chromium, Firefox, and Safari. Direct `file://` opening is required.

## 10. Acceptance criteria

- `build-standalone.ps1` produces the readable HTML and a gzip self-extracting variant.
- `scripts/verify-standalone.ps1` passes.
- The generated HTML contains no unresolved build placeholder.
- The generated HTML contains no external script, stylesheet, frame, module import, or CSS asset URL.
- Runtime CSP includes `connect-src 'none'`.
- The full core user flow works after opening either generated HTML directly.
- No data leaves the page.
- Japanese and English copy both fit at 360px width.

## 11. Open decisions for a new app

Replace these with explicit decisions before implementation:

- Maximum accepted input size.
- Supported input file types.
- Export file formats and naming rules.
- Persistence strategy and reset behavior.
- Undo/redo scope.
- Error and recovery behavior.
- Required third-party libraries.
- Whether bilingual UI is required.

## In-app help

The upper-right header includes a compact help button. It opens a bilingual “使い方と注意事項” dialog containing:

- the real user workflow,
- privacy and local-processing behavior,
- limitations and data-loss risks,
- any browser or device constraints relevant to the app.

Acceptance criteria: help content is updated together with each user-facing behavior change and contains no leftover starter instructions.
