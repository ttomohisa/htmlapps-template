# 再利用UIコンポーネント

`components/` には、このテンプレートから新しい単一HTMLアプリを作るときに再利用できるUI部品を置きます。

通常の部品は `src/index.template.html` にコピーまたは組み込みます。次の共通UI規約部品は固定版をビルダーが内包します。最終成果物は1つのHTMLです。WebRTC QRペアリングは既存のAsset Pipelineで固定版のQRライブラリを内包します。

## Browser Kitty 共通UI規約 1.0.0

このリポジトリの `components/ui-conventions.js` と `.css` が正本です。利用側は両ファイル、`components/ui-conventions.lock.json`、`scripts/embed-ui-conventions.ps1` をそのままコピーし、アプリ固有の接続処理を持ちます。実行時通信と自動更新はありません。SHA-256はファイルのバイト列を検証するため、LF改行を維持してください。

ソースに各1個の `<style>__BK_UI_CSS__</style>` と `<script>__BK_UI_JS__</script>` を配置します。共通CSSはアプリCSSの後に置きます。既存ビルダーでテンプレートを読み込んだ後、他の置換の前に実行します。

```powershell
. (Join-Path $Root 'scripts\embed-ui-conventions.ps1')
$template = Expand-BrowserKittyUI -Template $template -ComponentsPath (Join-Path $Root 'components')
```

ヘルパーはマーカーの欠落・重複と固定SHA-256の不一致で失敗します。lock形式は `{ "version": "1.0.0", "source": "htmlapps-template", "files": { "ui-conventions.js": "<sha256>", "ui-conventions.css": "<sha256>" } }`。配布HTMLにも規約・部品版を記録します。差異を消すためだけにhashを書き換えず、正本の両ファイルを意図的に更新してください。

ブラウザーAPIは `BrowserKittyUI`、Nodeでは同じファイルを `require()` できます。

| API | 契約 |
| --- | --- |
| `version`, `languageKey` | `1.0.0`, `browser-kitty:ui-language:v1` |
| `resolveLanguage({url,storage,legacyKeys,languages})` | 読み取りのみ。有効なURL ja/en → 共通設定 → 指定順の旧設定 → ブラウザー言語一覧で最初の対応言語 → en。ja-JP等にも対応。省略時は安全にブラウザー既定値へアクセスし、`storage:null` は保存領域を使いません。URLや旧設定を読むだけで共通設定へ書き込みません。 |
| `chooseLanguage(language,{storage,url,history})` | ja/enを検証し、明示操作時だけ共通設定を書きます。既存URLのlangだけを履歴追加なしで更新。失敗しても `{language,persisted,urlUpdated}` を返します。画面翻訳はアプリが行い、`persisted:false` なら `languageSessionOnly` を通知します。旧設定には書きません。 |
| `text(key,language,values)` | 共通文言。`sessionOnly`, `manualSave`, `dirty`, `saving`, `saved`, `saveFailed`, `downloadStarted`, `previousResult`, `stopping`, `stopProcessing`, `cancel`, `languageSessionOnly`。`saved` は表示用文字列 `values.time` を追加できます。`textContent` で表示します。 |
| `setButtonState(button,state)` | `ready`, `unavailable`, `busy`, `stopping`。実際のdisabled、`data-bk-state`、処理中の読み上げ属性を設定し、文言・アイコンは維持。前提条件、理由、進行形のラベル、二重処理ガードはアプリが持ちます。 |
| `setSaveStatus(element,{mode,state,language,time})` | modeは`session/manual/autosave`、stateは`dirty/saving/saved/error`。文字列のみで表示し、`role=status`、`aria-live=polite` を設定。session/manualは保持条件を表示し、自動保存成功を主張しません。autosaveのsavedは現在の内容の永続化を確認した時だけ渡します。 |

ボタンごとに `data-bk-button data-bk-variant="primary|secondary|danger"` を指定します。標準disabled、busy/stoppingスピナー、動きを減らす設定、緑のフォーカスリングに対応。`data-bk-header-action` は44×44pxの操作領域、`data-bk-save-status` は保存状態表示です。対象外のボタンへ一括適用しません。無効理由は近くに置き、処理中も言語・ヘルプを使えるようにします。通常ダウンロードには `downloadStarted` を使い、端末への書込み完了と誤認させません。

翻訳・処理・保存・削除はアプリが所有します。言語切替で入力・選択・処理を維持し、document.lang、タイトル、ヘルプ、読み上げ名も更新します。別タブを突然切り替えません。共通設定は同じorigin内のみで、file URL間の共有は保証しません。既存 `AppConfirm`、`AppToast`、非同期ガードを引き続き使います。

スターターは保存成功・失敗・再試行、空入力の復元、共通言語切替、コピーの二重実行防止を示します。動作検証は `node --test scripts/test-ui-conventions.cjs scripts/test-starter-ui.cjs`。通常のPowerShell検証はNodeなしでhashとマーカーの回帰検証も実行します。

`scripts/build-ui-cascade-fixture.ps1` の後に `dist/ui-conventions-cascade.html` を開くと、実際のブラウザーCSSエンジンで競合するアプリのhover規則との優先順位を検証します。danger・secondaryのhover、disabled、busyの背景・文字色・opacityの4行がすべてPASSであることを確認します。`:is(:hover,.fixture-hover)` で詳細度を保ったhoverを再現します。

## 完全サーバーレスWebRTC QRペアリング

`components/webrtc-qr-pairing.html` は、Browser Kitty系アプリで2台のブラウザーを、シグナリングサーバー / STUN / TURN / WebSocket / 外部APIなしで直接つなぐ場合の標準パターンです。低レベル関数だけではなく、接続UIと状態管理をまとめて持ちます。

含まれるもの：

- ホスト / 参加端末の役割選択。
- Offer / Answerの分割QR受け渡しとコピー＆ペーストfallback。
- `BarcodeDetector` + 内包 `jsQR` fallback。
- 低解像度カメラを考慮したQRページとカメラ選択。
- `RTCPeerConnection({ iceServers: [] })`。
- ICE gathering完了後だけ接続情報を出し、タイムアウト時に途中SDPを使わない。
- IPアドレスを露出せずIPv4 / IPv6 / mDNS候補を診断。
- 古い非同期試行を無視するguardと再試行クリーンアップ。
- 参加端末のAnswer生成を遅延し、ホストの返答QRカメラを先に準備するフロー。
- 接続前ICE失敗時の新しいAnswer QR自動再生成。
- 標準reliable DataChannelと、アプリ固有channel構成の拡張hook。

`examples/dependencies.webrtc-qr.json` の固定QR依存を使います。第三者minified bundleをアプリ本体へ直接貼り付けないでください。

詳しい実装契約・制限・プロトコル互換・実機テスト項目は [WebRTC QRペアリングコンポーネント](WEBRTC_QR_PAIRING.ja.md) を参照してください。

## 確認ダイアログ

`components/confirm-dialog.html` は、取り返しのつかない・高リスクな操作で `window.confirm()` の代わりに使う自前の確認UIです。スターター本体ではAPIを同梱しつつ、安全に戻せる「消去」はToast + Undoの例にしています。

- PCでは中央のモーダル
- スマートフォンでは下から出るボトムシート風
- `env(safe-area-inset-bottom)` 対応
- `Esc`、閉じるボタン、背景タップでキャンセル
- 実行後に元のフォーカスへ戻す
- 完全削除など取り返しのつかない破壊的操作は `tone: 'danger'`
- 外部依存・外部通信なし
- `Promise<boolean>` を返す

### 使用例

```js
const ok = await AppConfirm.ask({
  title: language === 'ja' ? '確認' : 'Confirm',
  message: language === 'ja'
    ? 'この履歴を削除しますか？'
    : 'Delete this history item?',
  confirmLabel: language === 'ja' ? '削除する' : 'Delete',
  cancelLabel: language === 'ja' ? 'キャンセル' : 'Cancel',
  tone: 'danger'
});

if (!ok) return;
deleteHistoryItem();
```

### オプション

| 項目 | 内容 |
| --- | --- |
| `title` | ダイアログのタイトル |
| `message` | 確認本文 |
| `confirmLabel` | 実行ボタンの文言 |
| `cancelLabel` | キャンセルボタンの文言 |
| `tone` | `'default'` または `'danger'` |

完成したアプリでは、アプリ自身の翻訳オブジェクトからタイトル・本文・ボタン文言を渡すことを推奨します。

## 実装ルール

- 上書きや完全削除など、取り返しのつかない・高リスクな操作では `window.confirm()` よりこの部品か同等の自前UIを優先します。安全に元へ戻せる削除・消去は、下記のToast + Undoを優先します。
- 確認本文へHTML文字列を差し込まず、テキストとして渡します。
- スマートフォンでは48px程度のタップ領域とSafe Areaを維持します。
- アプリ固有の見た目に変更しても、`Esc`、背景タップ、フォーカス復帰、キーボード操作を維持します。
- `components/` の部品を変更した場合は、スターター本体に組み込まれた同等実装とドキュメントも同期します。

## トースト / Undo

`components/toast.html` は短い状態通知と Undo の標準部品です。安全に元へ戻せる操作では、実行前に確認ダイアログを出すより「実行 → トーストの元に戻す」を優先します。

```js
AppToast.show({
  message: '削除しました',
  actionLabel: '元に戻す',
  duration: 5000,
  onAction: () => restoreDeletedItem()
});
```

トーストを何段も積まず、最新の意味ある通知へ置き換えます。上書きなど取り返しがつかない操作は `AppConfirm` を使います。

## コンパクトメニュー

`components/popover-menu.html` は「絞り込み」「管理」「その他」「出力設定」のような小さなメニュー向けです。外側クリック、`Esc`、画面サイズ変更、別メニューを開いたときに自動で閉じます。`Esc` ではトリガーへフォーカスを戻し、狭い画面ではパネルが画面外へ出ないよう位置を補正します。

`data-popover-trigger` + `aria-controls` と、対応する `data-popover-panel` を使います。最重要の主操作までメニューへ隠さないでください。

## プリセット + 自由入力の数値設定

`components/setting-field.html` は横幅、FPS、品質、時間などで使う標準パターンです。通常は少数のプリセットを見せ、自由入力を選んだときだけ min/max を控えめに表示します。入力途中では強制 clamp せず、change / blur で正規化します。

`settingchange` イベントを購読するか、`AppSettingField.init()` に `onChange` を渡します。単位は入力値の外側へ表示します。

## 非同期処理 / 入力変更ガード

`components/async-state.html` の `AppAsyncState.create()` は、処理フェーズと入力世代番号をまとめて扱います。非同期処理を開始する前に世代番号を取得し、結果をUIへ反映する直前に `isCurrent(token)` を確認してください。新しいファイルへ変更したら `invalidateSource()` を呼ぶことで、それ以前の処理結果をすべて古いものとして扱えます。

```js
const jobState = AppAsyncState.create({ onChange: renderState });

function onNewFile(file) {
  jobState.invalidateSource();
  clearOldPreviewAndResult();
  jobState.setPhase(file ? 'ready' : 'empty');
}

async function run() {
  const token = jobState.captureGeneration();
  jobState.setPhase('processing', { progress: 0 });
  const result = await processCurrentFile();
  if (!jobState.isCurrent(token)) return;
  showResult(result);
  jobState.setPhase('result', { progress: 1 });
}
```

この部品を使わない場合も、古い入力の遅延結果が新しい入力の画面を上書きしない設計は必須です。

## スマホ固定ボトムナビ / ページタブ / 操作バー

`components/mobile-bottom-bar.html` は、スマートフォンで **3〜5個の意味のあるグループや主要操作**へいつでもアクセスしたいアプリ向けの標準コンポーネントです。PCでは非表示、`600px` 以下では Safe Area 対応の固定バーとして表示します。

長いツールでは、今後は **「タブを押すとページが切り替わる」方式を第一候補**にします。スマホでは選択中のグループだけを表示し、PCでは従来どおりすべてのセクションを通常の文書フローで表示します。デスクトップUIを単純に縦積みしただけの長いスマホ画面を避けられます。

たとえば次のような構成に向いています。

- Device Check系の `概要 / カメラ・音声 / 入力 / 画面・端末`。
- メディア編集系の `素材 / 編集 / プレビュー / 出力`。
- ドキュメント系の `スキャン / ページ / PDF`。
- 一部はページ、一部は「実行」「保存」のような操作にする混在型。

テンプレートにあるから必ず付けるものではありません。短い1本道の操作で主ボタンも1つだけなら、通常配置のボタンの方が分かりやすいです。

### 推奨：スマホで本当にページ切替する

`<body>` に次の2クラスを付けます。

```html
<body class="has-mobile-bottom-bar has-mobile-page-tabs">
```

各グループを `app-mobile-page` で囲み、最初に表示するページだけ `is-mobile-active` を付けます。

```html
<section id="overviewPage" class="app-mobile-page is-mobile-active">…</section>
<section id="mediaPage" class="app-mobile-page">…</section>
<section id="inputPage" class="app-mobile-page">…</section>
<section id="devicePage" class="app-mobile-page">…</section>
```

下部タブは `data-mobile-page-target` で接続します。

```html
<nav class="app-mobile-bottom-bar" id="mobileBottomBar" style="--app-mobile-bottom-items: 4" aria-label="スマートフォン用ナビゲーション">
  <button class="app-mobile-bottom-item is-active" data-mobile-key="overview" data-mobile-page-target="overviewPage" aria-current="page">…</button>
  <button class="app-mobile-bottom-item" data-mobile-key="media" data-mobile-page-target="mediaPage">…</button>
  <button class="app-mobile-bottom-item" data-mobile-key="input" data-mobile-page-target="inputPage">…</button>
  <button class="app-mobile-bottom-item" data-mobile-key="device" data-mobile-page-target="devicePage">…</button>
</nav>
```

`600px` より広い画面では `.app-mobile-page` は常に `display: block` のため、PC表示は変わりません。スマホだけ `has-mobile-page-tabs` により、`.is-mobile-active` のページだけ表示されます。

初期化は通常どおりです。

```js
const mobileBar = AppMobileBottomBar.mount(
  document.getElementById('mobileBottomBar')
);
```

処理の途中から別タブへ案内したい場合は、クリックを偽装せずAPIで切り替えます。

```js
mobileBar.showPage('media');
console.log(mobileBar.currentPage()); // "media"
```

たとえば「クイック診断を開始 → カメラ・音声タブへ移動」のような誘導に使えます。

### 従来方式：セクションへスクロール

スマホでも全セクションを常に表示したまま、下部バーからその位置へジャンプしたいアプリでは `data-mobile-target` を使えます。

```html
<button class="app-mobile-bottom-item" data-mobile-key="source" data-mobile-target="sourceSection">…</button>
```

ヘルパーは対象セクションへスクロールし、利用可能なら `IntersectionObserver` で現在位置も追従します。意味もなくページ切替とセクションスクロールを混ぜず、そのアプリのスマホフローに合う方を選びます。

### 操作ボタン

`data-mobile-action` を使えば「実行」「保存」などのアプリ固有操作も置けます。

```html
<button class="app-mobile-bottom-item primary" data-mobile-key="run" data-mobile-action="run">…</button>
<button class="app-mobile-bottom-item" data-mobile-key="save" data-mobile-action="save" disabled>…</button>
```

```js
const mobileBar = AppMobileBottomBar.mount(
  document.getElementById('mobileBottomBar'),
  {
    actions: {
      run: () => runJob(),
      save: () => saveResult()
    }
  }
);

mobileBar.setEnabled('save', false);
// 正常な結果ができた後
mobileBar.setEnabled('save', true);
```

### ヘルパーAPI

- `showPage(keyOrId, options?)`：ページタブを切り替え、必要ならその位置まで移動。
- `currentPage()`：現在のページキーを取得。
- `setActive(key)`：アクティブ表示を変更。
- `setEnabled(key, enabled)`：標準の `disabled` 状態を変更。
- `button(key)`：対象ボタンを取得。
- `destroy()`：イベントやObserverを解除。

初期化オプションには `initialPage`、`pageTopTarget`、`pageTopOffset`、`onPageChange`、`actions`、`observeSections` などを使えます。

### UXルール

- 項目数は **3〜5個** を基本にし、4個を有力な初期案にします。
- アイコンだけにせず、短い文字ラベルも必ず付けます。
- スマホで3〜5グループに自然に分かれる長いツールは、**縦長1ページよりページ切替を優先**します。
- PCでは通常の文書フローですべて見せます。スマホタブの都合でPCまで無理にページ分割しません。
- 各スマホページの内部は通常のページスクロールを使い、入れ子のスクロール領域を作らないでください。
- タブ切替で入力値や処理結果をリセットしません。タブ変更はナビゲーションです。
- まだ実行できない操作は見た目だけ薄くせず、本当に `disabled` にします。
- 「保存」「共有」は正常な結果ができた後に有効化します。
- 固定CTAを重複させません。ボトムバーに固定の主操作があるなら、別の全幅固定ボタンは通常不要です。
- `env(safe-area-inset-bottom)` と本文側の下余白を維持し、バーで内容を隠さないようにします。
- フォーカス表示、`aria-current`、標準button、`disabled` セマンティクスを維持します。
- 320 / 360 / 390〜393 / 430px幅で確認し、ページ全体の横スクロールが出ないことを確認します。

## WebRTCの接続成立ルール

`webrtc-qr-pairing.html` ではPeerConnectionの `connected` だけをアプリ接続済みとして扱いません。指定した準備完了DataChannelが `open` になって初めて `onConnected` を発火します。独自Channel構成ではreliableな制御Channelを `readyChannelLabel` に指定します。
