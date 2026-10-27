'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.join(__dirname, '..');
// Browser APIs are the boundary: the actual starter script and shared library run unchanged.
function start({ initial = {}, failSave = false, clipboard = async () => {} } = {}) {
  class Node {
    constructor() { this.value = ''; this.textContent = ''; this.attrs = {}; this.dataset = {}; this.listeners = {}; this.classList = { add() {}, remove() {}, toggle() {} }; this.isConnected = true; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(k, v) { this.listeners[k] = v; }
    focus() {} select() {} click() {} append() {}
  }
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, new Node()); return nodes.get(id); };
  const data = new Map(Object.entries(initial));
  const context = {
    URL, Blob, Intl, TextDecoder, Uint8Array, HTMLElement: Node,
    document: { querySelector: s => get(s.slice(1)), querySelectorAll: () => [], documentElement: { lang: '' }, createElement: () => new Node(), head: new Node() },
    navigator: { languages: ['en-US'], clipboard: { writeText: clipboard } },
    localStorage: { getItem: k => data.get(k) ?? null, setItem: (k, v) => { if (failSave) throw Error('full'); data.set(k, v); } },
    location: { href: 'https://example.test/?lang=en' }, history: { replaceState() {} },
    setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame: fn => fn(), addEventListener() {}
  };
  context.window = context;
  let html = fs.readFileSync(path.join(root, 'src/index.template.html'), 'utf8');
  html = html.replace('__APP_CONFIG_JSON__', fs.readFileSync(path.join(root, 'app.config.json'), 'utf8')).replace('__BUILD_MANIFEST_JSON__', '{}').replace('__EMBEDDED_ASSET_BUNDLE_JSON__', '{}').replace('__BK_UI_JS__', fs.readFileSync(path.join(root, 'components/ui-conventions.js'), 'utf8'));
  for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInNewContext(script[1], context);
  return { nodes, get, data, context };
}
test('starter does not report failed persistence as saved and retains current work', () => {
  const app = start({ failSave: true });
  app.get('editor').value = 'keep me'; app.get('editor').listeners.input();
  assert.equal(app.get('saveStatus').textContent, 'Could not save in this browser');
  assert.equal(app.get('editor').value, 'keep me');
});
test('starter restores saved empty input and language switching preserves it', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'app.config.json'), 'utf8'));
  const app = start({ initial: { [`${config.slug}:starter-text`]: '' } });
  assert.equal(app.get('editor').value, '');
  app.get('languageButton').listeners.click();
  assert.equal(app.get('editor').value, '');
  assert.equal(app.data.get('browser-kitty:ui-language:v1'), 'ja');
  assert.equal(app.data.has(`${config.slug}:language`), false);
});
test('starter prevents duplicate clipboard requests while busy then restores ready state', async () => {
  let release; let calls = 0;
  const app = start({ clipboard: () => { calls++; return new Promise(resolve => { release = resolve; }); } });
  const first = app.get('copyButton').listeners.click();
  const second = app.get('copyButton').listeners.click();
  assert.equal(calls, 1);
  assert.equal(app.get('copyButton').disabled, true);
  release(); await first; await second;
  assert.equal(app.get('copyButton').disabled, false);
});
