# Offline Verification

1. Run `build-standalone.bat`.
2. Open `dist/index.html` directly.
3. Open browser developer tools and clear the Network panel.
4. Enable offline mode or disconnect the device.
5. Reload the local HTML.
6. Exercise every core input, editing, preview, worker, and export flow.
7. Confirm there is no failed external resource request and no console error.
8. Confirm output files still open correctly.

For GitHub Pages, one initial request downloads the HTML. Clear the Network panel after the page has loaded, then test the complete app flow.
