# Reusable UI components

These files are source snippets for apps created from this template. They are **not automatically bundled** by the builder. Copy or adapt the component inside `src/index.template.html` so the final release remains one self-contained HTML file. Most are dependency-free; components that need embedded third-party assets explicitly point to a matching file under `examples/`.

- [`confirm-dialog.html`](confirm-dialog.html) — Promise-based confirmation dialog. Centered on desktop, bottom-sheet style on smartphones, safe-area aware, keyboard accessible, and suitable for destructive actions.
- [`toast.html`](toast.html) — Safe-area-aware transient status UI with optional action/Undo.
- [`popover-menu.html`](popover-menu.html) — Compact menu that closes on outside click, `Esc`, resize, or another menu opening.
- [`setting-field.html`](setting-field.html) — Preset + custom numeric input with unobtrusive range guidance and delayed normalization.
- [`async-state.html`](async-state.html) — Explicit async phase + source-generation guard that prevents stale results from a previous input.
- [`mobile-bottom-bar.html`](mobile-bottom-bar.html) — Fixed smartphone bottom navigation / workflow bar with icons, safe-area handling, true mobile page switching, backward-compatible section scrolling, disabled states, and an optional action API.
- [`webrtc-qr-pairing.html`](webrtc-qr-pairing.html) — Fully serverless WebRTC host/join pairing UI with chunked QR signaling, camera scanner, complete ICE gathering, diagnostics, stale-attempt cleanup, delayed Answer creation, and retry handling. Requires the pinned assets from `examples/dependencies.webrtc-qr.json`; after copying them, sync `dependencies.lock.json`.

Documentation: [English](../docs/COMPONENTS.md) / [日本語](../docs/COMPONENTS.ja.md)

WebRTC pairing details: [English](../docs/WEBRTC_QR_PAIRING.md) / [日本語](../docs/WEBRTC_QR_PAIRING.ja.md)

## WebRTC readiness note

The WebRTC pairing component waits for the designated readiness DataChannel to open before reporting application-ready. Custom DataChannel layouts use `readyChannelLabel` for a reliable control channel.


## Media file picker fallback

`media-file-picker.html` is an optional source snippet for image/video tools whose OS media picker may omit files. It provides a smartphone-only secondary button with a separate unrestricted input. Both paths must use the app's actual validation/read handler. Localize `chooseMedia` and `chooseFiles`, narrow the primary accept attribute to the supported media, and handle asynchronous errors in the app's handler. Do not add this component to unrelated apps.

## Additional reusable UI

- [`file-picker.html`](file-picker.html) — File selection, drag/drop, replacement and optional mobile media fallback; asynchronous selection guard.
- [`file-export.html`](file-export.html) — Editable filenames, validated Blob results, download and optional native share.
- [`progress-panel.html`](progress-panel.html) — Determinate/indeterminate progress, cancellation and retry.
- [`action-toolbar.html`](action-toolbar.html) — Responsive SVG-labeled native action buttons.
- [`media-preview.html`](media-preview.html) — Local image/video display with intrinsic dimensions and URL cleanup.
- [`range-slider.html`](range-slider.html) — Accessible native start/end ranges with ordered values.
- [`segmented-control.html`](segmented-control.html) — Keyboard-accessible native radio mode switch.
- [`empty-state.html`](empty-state.html) — Localized empty state with optional action.
- [`fullscreen.html`](fullscreen.html) — Native fullscreen or an in-page dialog fallback.
- [`before-after.html`](before-after.html) — Aligned local image comparison with an accessible slider.

Copy only relevant snippets into the app source; localize labels and supply actual validation, error and cancellation handlers. Accept is a picker hint, not validation. Share appears only on supported environments; download initiation does not guarantee file persistence.

Prefer the new `file-picker.html` for new file-based apps; `media-file-picker.html` remains the compact compatibility snippet for existing implementations. The full picker already supports the optional unrestricted mobile fallback. `before-after.html` accepts local blob/data image URLs only. The common filename normalization bounds both code point length and UTF-8 byte length.

## Release checks

The optional components are source snippets, not an automatically loaded library. Run the component contract and browser regression tests after changing them. Keep the app-specific translation keys and real file-processing callbacks in sync. Native fullscreen, sharing, file selection and WebRTC camera behavior need real-device validation.
