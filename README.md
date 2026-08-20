# Single HTML App Template

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-template/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-template/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-template/)

[日本語版 README](README.ja.md)

A GitHub repository template for building privacy-friendly browser apps that can be distributed as a **single self-contained HTML file**.

It generalizes the approach used by [PDF Organizer](https://github.com/ttomohisa/html-pdf-organizer): develop from readable source, pin external libraries, embed workers/WASM/fonts/support assets at build time, verify the generated file, and publish it through GitHub Pages.

## 🚀 Live demo

### [Open the starter app on GitHub Pages](https://ttomohisa.github.io/htmlapps-template/)

GitHub Pages delivers the initial HTML. The starter is designed so application processing can remain inside the browser, with runtime network connections blocked by the default Content Security Policy.

[![Single HTML App Template screenshot](assets/screenshot.png)](https://ttomohisa.github.io/htmlapps-template/)

## Features

- Build a complete browser app into `dist/index.html`
- Also generate an optional gzip self-extracting `dist/index.self-extract.html`
- Build on Windows by double-clicking `build-standalone.bat`
- No Python or Node.js required for the standard build flow
- Pin exact npm package versions and embed only explicitly selected files
- Embed large assets with `gzip` / `auto` compression when useful
- Record SHA-256 hashes for downloaded package tarballs and embedded files
- Block runtime network connections with `connect-src 'none'`
- Avoid runtime CDN, remote fonts, analytics, and telemetry by default
- Validate builds and deploy GitHub Pages with GitHub Actions
- Start with Japanese / English UI, responsive layout, keyboard access, embedded SVG favicon, and a light-only interface
- Reuse confirmation dialogs, Undo toasts, popover menus, numeric setting fields, async-state guards, and smartphone bottom bars
- Keep product requirements in `APP_SPEC.md` and implementation rules for coding LLMs in `AGENTS.md`
- Require file-producing apps to let users edit the output filename before export
- Generate `build-size-report.json` so size regressions are visible without automatically sacrificing UX

## Quick start

### Create a repository from this template

1. Open this repository on GitHub.
2. Choose **Use this template** and create a new repository.
3. Rewrite `APP_SPEC.md` for the app you want to build.
4. Update `app.config.json` with the app name, slug, version, description, and repository information.
5. Tell your coding LLM to read `AGENTS.md` before implementation.
6. Edit `src/index.template.html` and reuse files from `components/` where appropriate.
7. Run `build-standalone.bat` on Windows.
8. Test the generated files in `dist/`, including with the network disabled where applicable.

A reusable LLM request and workflow are available in [LLM Workflow](docs/LLM_WORKFLOW.md).

### Build locally

Double-click `build-standalone.bat` on Windows 10/11, or run:

```bat
build-standalone.bat
```

Generated output:

```text
dist/
├─ index.html
├─ index.self-extract.html
├─ dependency-manifest.json
├─ build-size-report.json
├─ self-extract-manifest.json
└─ .nojekyll
```

`dist/index.html` and `dist/index.self-extract.html` are generated files. Edit `src/index.template.html` and rebuild instead of modifying them directly.

## Usage

A typical development cycle is:

1. Define product behavior and acceptance criteria in `APP_SPEC.md`.
2. Update app metadata in `app.config.json`.
3. Add exact third-party dependencies to `dependencies.json` only when necessary.
4. Implement the app in `src/index.template.html`.
5. Reuse generic UI patterns from `components/` instead of rebuilding common interactions differently in every app.
6. Run `build-standalone.bat`.
7. Open `dist/index.html` directly and verify the main workflow, responsive behavior, keyboard access, and output filenames.
8. If the self-extracting build is enabled, also test `dist/index.self-extract.html`.
9. Check `dist/build-size-report.json` before publishing when large libraries or WASM assets are involved.

### Files to know

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Implementation contract for coding LLMs |
| `APP_SPEC.md` | Product behavior and acceptance criteria |
| `app.config.json` | App name, slug, version, descriptions, build settings |
| `dependencies.json` | Exact npm packages and files to embed |
| `src/index.template.html` | Editable application source |
| `components/` | Reusable dependency-free UI patterns |
| `build-standalone.bat` | Windows build entry point |
| `build-standalone.ps1` | Standalone HTML builder |
| `docs/LLM_WORKFLOW.md` | Recommended workflow for coding LLMs |

## Publish with GitHub Pages

The repository includes a workflow that builds the generated HTML and deploys `dist` to GitHub Pages.

1. Create a repository from this template and push it to GitHub.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Push to `main`, or manually run the deployment workflow from the Actions tab.
4. After a successful deployment, the generated app is available from that repository's GitHub Pages URL.

`.github/workflows/deploy-pages.yml` builds on a Windows runner, verifies the generated output, and publishes `dist` when Pages is enabled. If Pages has not been configured yet, the workflow keeps the build result as an Actions artifact and skips only deployment.

## Development and build layout

```text
.
├─ AGENTS.md
├─ APP_SPEC.md
├─ app.config.json
├─ dependencies.json
├─ components/
│  ├─ async-state.html
│  ├─ confirm-dialog.html
│  ├─ mobile-bottom-bar.html
│  ├─ popover-menu.html
│  ├─ setting-field.html
│  └─ toast.html
├─ src/
│  └─ index.template.html
├─ scripts/
│  ├─ build-self-extract.ps1
│  ├─ check-repository.ps1
│  ├─ verify-self-extract.ps1
│  └─ verify-standalone.ps1
├─ docs/
├─ examples/
├─ dist/
├─ build-standalone.bat
├─ build-standalone.ps1
└─ .github/workflows/
```

### Add or update dependencies

Add exact package versions and required files to `dependencies.json`. The starter has no dependencies, so its initial build can complete without downloading packages.

See `examples/dependencies.dayjs.json` and [Adding Embedded Dependencies](docs/DEPENDENCIES.md) for details.

To discard the package cache and download pinned packages again:

```bat
build-standalone.bat -ForceDownload
```

The build process can:

- Download pinned package tarballs from the official npm registry
- Embed only explicitly declared files
- Store selected large assets with `gzip` / `auto` compression
- Record SHA-256 hashes for package tarballs and embedded files
- Reject unresolved build placeholders and prohibited external runtime references
- Generate `dist/dependency-manifest.json`
- Generate `dist/build-size-report.json`
- Warn when configured size budgets are exceeded without automatically failing solely because the app became large

The required PowerShell scripts avoid `Get-FileHash` and `::new()` so they remain compatible with more constrained Windows PowerShell environments.

### Self-extracting HTML

A normal build can create two variants:

- `dist/index.html`: readable output suited to debugging, SEO, and the default GitHub Pages entry point
- `dist/index.self-extract.html`: gzip-compressed output restored in the browser with `DecompressionStream`

The self-extracting version remains a single offline-capable HTML file, but requires JavaScript and a browser with `DecompressionStream`. Keep the normal HTML as the default Pages entry point and treat the self-extracting variant as an optional distribution artifact.

To skip the self-extracting file:

```powershell
.\build-standalone.ps1 -SkipSelfExtract
```

## Reusable UI components

`components/` contains dependency-free patterns intended to keep finished apps consistent without forcing every app into the same layout.

- `confirm-dialog.html`: irreversible or high-risk actions such as overwrite or permanent deletion
- `toast.html`: lightweight feedback and Undo for reversible actions
- `popover-menu.html`: compact Filter / Manage / More menus with outside-click and `Esc` handling
- `setting-field.html`: preset + custom numeric input patterns
- `async-state.html`: guards against stale asynchronous results after the source changes
- `mobile-bottom-bar.html`: safe-area-aware smartphone navigation or workflow actions with real disabled states

See [Reusable UI components](docs/COMPONENTS.md) for usage and UX rules.

## Privacy and runtime network protection

The starter Content Security Policy blocks runtime connections with `connect-src 'none'`. The intended architecture is to embed required application assets into the generated HTML so user processing can stay inside the browser.

A GitHub Pages deployment still needs the initial HTML request. For a fully disconnected session, open the generated `dist/index.html` or `dist/index.self-extract.html` locally.

Static checks are guardrails rather than proof of privacy or security. Before publishing an app, also inspect its browser network activity and review any third-party code you add.

## Limitations

- This is a development template, not a framework; app-specific functionality still belongs in `APP_SPEC.md` and `src/index.template.html`.
- Browser capabilities differ, so features such as sensors, WebCodecs, WASM threads, file-system APIs, or `DecompressionStream` may need compatibility handling in individual apps.
- A single HTML file can become large when embedding WASM, models, fonts, or media assets. Use the size report and compression options rather than removing useful UX blindly.
- `connect-src 'none'` is appropriate for fully local apps but must be reviewed if a future app intentionally requires network APIs.
- Static verification cannot prove that all third-party code is secure or privacy-preserving.
- The self-extracting variant requires JavaScript and `DecompressionStream`; use the normal generated HTML when broader compatibility matters.

## Dependencies

The starter application has no third-party runtime dependencies by default.

Dependencies added to an app are declared with exact versions in `dependencies.json` and should also be reflected in that app's `THIRD_PARTY_NOTICES.md` where required by their licenses.

## Contributing

Bug reports, improvements to the build system, and reusable UI proposals are welcome through GitHub Issues. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance.

## License

Copyright © 2026 ttomohisa

Licensed under the [MIT License](LICENSE). Applications created from this template should update authorship and third-party notices as appropriate.
