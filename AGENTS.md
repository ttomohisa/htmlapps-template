# AGENTS.md — Single HTML App Contract

This file is the first instruction for any coding LLM or agent working in this repository.

## Read order

1. Read this file completely.
2. Read `APP_SPEC.md` completely.
3. Read `docs/ARCHITECTURE.md` and `docs/LLM_WORKFLOW.md`.
4. Inspect the current implementation before changing code.
5. Implement, build, verify, and update documentation in the same task.

## Non-negotiable product constraints

- The release artifact is one file: `dist/index.html`.
- The app must work when `dist/index.html` is opened directly with `file://` unless `APP_SPEC.md` explicitly says otherwise.
- No runtime CDN, external font, analytics, telemetry, API request, or hidden network dependency.
- User-selected files and entered data must stay in the browser unless `APP_SPEC.md` explicitly defines an export initiated by the user.
- Keep a restrictive Content Security Policy with `connect-src 'none'` for the default template.
- Desktop and smartphone layouts are both first-class.
- Keyboard navigation, visible focus, labels, sufficient contrast, and reduced-motion behavior are required.
- Japanese and English should live in the same HTML when the app is intended for both languages.
- Do not use generic emoji as the main interface iconography. Prefer simple inline SVG icons.
- Do not edit `dist/index.html` manually. Edit `src/index.template.html`, config, and build scripts; then rebuild.

## Dependency rules

- Prefer browser-native APIs when they are reliable and reasonably small to implement.
- Add third-party packages only when they materially reduce risk or complexity.
- Add npm assets through `dependencies.json`; never paste minified third-party bundles into the source template.
- Pin exact versions. Do not use `latest`, ranges, tags, or unversioned URLs.
- Record the license and homepage in `dependencies.json` and update `THIRD_PARTY_NOTICES.md`.
- Imported module files must be self-contained. The generic loader does not rewrite relative imports.
- Workers, WASM, fonts, dictionaries, and support files must also be listed as embedded assets.

## Source organization

The template intentionally keeps the app in one source HTML so that an LLM can understand the complete runtime without chasing a large module graph.

Inside `src/index.template.html`:

- Keep design tokens and responsive rules near the top.
- Keep reusable embedded-asset loading code generic.
- Keep application state explicit and serializable where practical.
- Mark the replaceable app area with `APP:BEGIN` and `APP:END` comments.
- Keep translations in one clearly named object.
- Avoid global mutable state except the documented `window.StandaloneAssets` API.
- Add comments for non-obvious algorithms, browser workarounds, and performance-sensitive paths.

If the application becomes too large for safe single-file source editing, split development source under `src/` and update the builder to concatenate it. The release must still be one HTML file.

## Required checks before completion

Run:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

Then verify at minimum:

- Fresh load with empty local storage.
- Main happy path.
- Invalid, empty, and unusually large input.
- Undo/redo where destructive editing exists.
- Exported file contents and filename.
- Reload persistence where persistence exists.
- Japanese and English.
- Light, dark, and system theme behavior.
- Narrow smartphone width and desktop width.
- Keyboard-only operation.
- No console error.
- No runtime network request after the initial HTML load on GitHub Pages.
- Direct local opening of `dist/index.html`.

## Documentation required with code changes

Update these when relevant:

- `APP_SPEC.md`: behavior and acceptance criteria.
- `README.md` and `README.ja.md`: user-facing capabilities and usage.
- `CHANGELOG.md`: notable changes.
- `THIRD_PARTY_NOTICES.md`: dependency additions, removals, or upgrades.
- `SECURITY.md`: changed trust boundaries or file handling.

## Completion report format

Return a concise report containing:

1. What changed.
2. Important design decisions.
3. Files changed.
4. Verification performed and result.
5. Known limitations or unverified items.

Do not claim a browser, device, build, or network test was performed unless it was actually performed.
