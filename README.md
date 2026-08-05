# Single HTML App Template

[日本語 README](README.ja.md)

A GitHub repository template for humans and coding LLMs that repeatedly create **browser applications distributed as one self-contained HTML file**.

It generalizes the approach used by PDF Organizer: develop from readable source, pin external libraries, embed workers/WASM/fonts/support assets at build time, verify the output, and publish the generated single HTML through GitHub Pages.

![Single HTML App Template screenshot](assets/screenshot.png)

## Highlights

- One release artifact: `dist/index.html`
- Double-click `build-standalone.bat` on Windows
- No Python or Node.js required
- Exact npm versions with only explicitly selected files embedded as Base64
- SHA-256 records for package tarballs and every embedded file
- No runtime CDN, remote font, API, analytics, or telemetry
- Content Security Policy with `connect-src 'none'`
- GitHub Actions for pull request validation and GitHub Pages deployment
- Starter implementation for bilingual UI, themes, responsive layout, and keyboard access
- `AGENTS.md`, `APP_SPEC.md`, and a reusable LLM request included

## Read these first

| File | Purpose |
| --- | --- |
| `AGENTS.md` | The implementation contract an LLM reads first |
| `APP_SPEC.md` | Product behavior and acceptance criteria |
| `app.config.json` | Application name, slug, version, and description |
| `dependencies.json` | npm packages and files to embed |
| `src/index.template.html` | Editable application source |
| `build-standalone.ps1` | Standalone HTML builder |
| `docs/LLM_WORKFLOW.md` | Recommended LLM workflow and request |

## Create a new app

1. Enable this repository as a GitHub template.
2. Create a new repository with **Use this template**.
3. Rewrite `APP_SPEC.md` with the concrete product.
4. Update `app.config.json`.
5. Tell the coding LLM to begin with `AGENTS.md`.
6. After implementation, run `build-standalone.bat` on Windows.
7. Open `dist/index.html` directly and test the main flow with the network disabled.

A ready-to-use request is in [LLM Workflow](docs/LLM_WORKFLOW.md).

## Local build

Double-click `build-standalone.bat` on Windows 10/11, or run:

```text
build-standalone.bat
```

Discard the package cache and fetch pinned packages again:

```text
build-standalone.bat -ForceDownload
```

Generated output:

```text
dist/
├─ index.html
├─ dependency-manifest.json
└─ .nojekyll
```

`dist/index.html` is generated. Edit `src/index.template.html` and rebuild instead of modifying the output directly.

## Embed a third-party library

Add exact package versions and required files to `dependencies.json`. The starter has no dependencies, so its first build can finish without network access.

See `examples/dependencies.dayjs.json` and [Adding Embedded Dependencies](docs/DEPENDENCIES.md).

The builder downloads the package tarball from the official npm registry and embeds only the listed files. The generated application does not contact a CDN at runtime.

## GitHub Pages

`.github/workflows/deploy-pages.yml` runs on every push to `main`:

1. Build the standalone HTML on a Windows runner.
2. reject external runtime references and unresolved placeholders.
3. Publish `dist` to GitHub Pages.

Select GitHub Actions as the Pages deployment source in repository settings.

## Repository layout

```text
.
├─ AGENTS.md
├─ APP_SPEC.md
├─ app.config.json
├─ dependencies.json
├─ src/
│  └─ index.template.html
├─ scripts/
│  ├─ check-repository.ps1
│  └─ verify-standalone.ps1
├─ docs/
├─ examples/
├─ dist/
├─ build-standalone.bat
├─ build-standalone.ps1
└─ .github/workflows/
```

## Security and privacy

The starter CSP blocks runtime network connections. A GitHub Pages deployment needs one initial HTML request, but application processing then stays inside the page. For a fully disconnected session, open the generated `dist/index.html` locally.

Static checks are guardrails rather than proof. Before publishing, also inspect the browser network panel.

## License

Copyright © 2026 ttomohisa

Released under the [MIT License](LICENSE). Update authorship and third-party notices appropriately in applications created from this template.

- A standard upper-right “How to use & notes” dialog
