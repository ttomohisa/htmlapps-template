# Single HTML App Template

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-template/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-template/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-template/)

[English README](README.md)

LLMと人が、**配布物が1つのHTMLだけで完結するブラウザーアプリ**を継続的に作るためのGitHubリポジトリテンプレートです。

PDF Organizerで採用した「開発用HTMLから、固定バージョンの外部ライブラリ、Worker、WASM、フォント、補助素材までビルド時に内包し、GitHub Pagesへ公開する」考え方を、特定アプリに依存しない形へ整理しています。

![Single HTML App Templateの画面](assets/screenshot.png)

## このテンプレートの特徴

- 通常版 `dist/index.html` と、gzip自己解凍版 `dist/index.self-extract.html` を同時生成
- Windowsでは `build-standalone.bat` をダブルクリックしてビルド可能
- PythonやNode.jsは不要
- npmパッケージのバージョンを固定し、必要ファイルだけをBase64で内包
- パッケージtarballと各内包ファイルのSHA-256を記録
- 実行時のCDN、外部フォント、API、分析タグを使わない
- `connect-src 'none'` のContent Security Policy
- GitHub ActionsでPull Requestのビルド検証とGitHub Pages公開
- 日英UI、ライトモード固定、スマートフォン、キーボード操作の基本実装
- PCではモーダル、スマホではボトムシートになる汎用確認ダイアログを標準装備
- Safe Area・無効状態に対応したスマホ固定ボトムナビ / 操作バーを再利用部品として同梱
- LLM向けの `AGENTS.md`、仕様書 `APP_SPEC.md`、推奨プロンプトを同梱

## 最初に確認するファイル

| ファイル | 役割 |
| --- | --- |
| `AGENTS.md` | LLMが最初に読む実装契約 |
| `APP_SPEC.md` | 作るアプリの目的、機能、受入条件 |
| `app.config.json` | アプリ名、slug、バージョン、説明 |
| `dependencies.json` | 内包するnpmパッケージとファイル |
| `src/index.template.html` | 編集するアプリ本体 |
| `components/confirm-dialog.html` | 削除・全消去などに使う汎用確認ダイアログ |
| `components/mobile-bottom-bar.html` | スマホ固定ボトムナビ / ワークフロー操作バー |
| `build-standalone.ps1` | 完全内包HTMLと自己解凍版の生成 |
| `scripts/build-self-extract.ps1` | 通常版HTMLをgzip圧縮して自己解凍HTMLへ変換 |
| `docs/LLM_WORKFLOW.ja.md` | LLMへ依頼する手順 |

## 新しいアプリを作る

1. GitHubでこのリポジトリをテンプレートとして有効化します。
2. **Use this template** から新しいリポジトリを作成します。
3. `APP_SPEC.md` を新しいアプリの具体的な仕様へ書き換えます。
4. `app.config.json` を変更します。
5. `components/` を確認し、確認ダイアログなど再利用できる部品をアプリへ取り込みます。
6. LLMへ `AGENTS.md` から読むよう指示します。
7. 実装後、Windowsで `build-standalone.bat` を実行します。
8. `dist/index.html` と `dist/index.self-extract.html` を直接開き、ネットワークを切った状態でも主要機能を確認します。

そのまま使える依頼文は [LLMでアプリを作る手順](docs/LLM_WORKFLOW.ja.md) にあります。

## ローカルビルド

Windows 10/11で `build-standalone.bat` をダブルクリックします。

```text
build-standalone.bat
```

必須のビルドスクリプトは `Get-FileHash` と `::new()` に依存せず、制約のあるWindows PowerShell環境でも動きやすい構成にしています。SHA-256は.NETの暗号化APIで計算します。

依存パッケージをキャッシュから削除して再取得する場合：

```text
build-standalone.bat -ForceDownload
```

生成物：

```text
dist/
├─ index.html
├─ index.self-extract.html
├─ dependency-manifest.json
├─ self-extract-manifest.json
└─ .nojekyll
```

`dist/index.html` と `dist/index.self-extract.html` は生成物です。直接編集せず、`src/index.template.html` を変更して再ビルドしてください。

## 外部ライブラリを内包する

`dependencies.json` に固定バージョンと必要ファイルを記載します。初期状態は依存ゼロなので、初回ビルドは通信なしで完了します。

設定例は `examples/dependencies.dayjs.json`、詳しい読み込み方法は [依存ライブラリの追加](docs/DEPENDENCIES.md) を参照してください。

ビルド処理はnpm公式レジストリからtarballを取得し、指定ファイルだけをHTMLへ内包します。実行時にCDNへアクセスすることはありません。

## 自己解凍HTML

通常のビルドでは次の2種類を同時に生成します。

- `dist/index.html`：可読性、デバッグ、SEO、GitHub Pagesの既定ページに向く通常版
- `dist/index.self-extract.html`：元HTMLをgzip圧縮し、ブラウザーの `DecompressionStream` で展開する配布向け版

自己解凍版も外部ライブラリを使わず、1ファイルのままオフラインで動作します。JavaScriptが無効な環境や `DecompressionStream` 非対応ブラウザーでは開けません。GitHub Pagesのトップページには通常版を使い、自己解凍版はダウンロード配布や容量制限のある場所向けの副成果物として扱う設計です。

自己解凍ローダーは、BOMなしUTF-8のPowerShellスクリプトをWindows PowerShell 5.1で実行しても日本語が壊れないよう、意図的にASCII-onlyで生成します。日本語表示はHTML文字参照 / JavaScript Unicodeエスケープで表現し、faviconは `dist/index.html` に内包されたものを自動継承します。検証では文字コード退行、faviconの欠落・不一致、gzip展開後のバイト不一致をエラーにします。

自己解凍版を生成しない場合：

```powershell
.\build-standalone.ps1 -SkipSelfExtract
```

## GitHub Pages

新しいリポジトリを作成したら、最初に **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択してください。これはリポジトリごとに一度だけ必要な設定です。

`.github/workflows/deploy-pages.yml` は `main` へのpushごとに次を行います。

1. Windows runnerで完全内包HTMLを生成
2. 外部ランタイム参照と、宣言済みの未置換ビルドプレースホルダーを検査
3. Pagesが有効なら `dist` をGitHub Pagesへ公開
4. Pagesが未設定なら公開だけをスキップし、設定手順をActionsの概要へ表示

Pagesを有効化した直後は、Actions画面から **Re-run all jobs** を実行してください。Pages未設定でも生成済みHTMLは通常のActions artifactとして保存されます。

## リポジトリ構成

```text
.
├─ AGENTS.md
├─ APP_SPEC.md
├─ app.config.json
├─ dependencies.json
├─ components/
│  ├─ confirm-dialog.html
│  └─ mobile-bottom-bar.html
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

## 汎用UIコンポーネント

`components/` には、完成アプリへコピーして使える依存なしのUI部品を置きます。`confirm-dialog.html` は削除・全消去・上書き確認などに使う標準確認UIで、スターター画面の「消去」でも同じ `AppConfirm.ask()` パターンを使っています。

`mobile-bottom-bar.html` は、スマホで3〜5個の主要セクションや操作へ常時アクセスしたいアプリ向けの固定ボトムナビ / 操作バーです。Safe Area、アイコン＋文字ラベル、実際の `disabled` 状態（例：結果ができる前の保存）、画面内スクロール、アプリ固有アクションに対応します。すべてのアプリへ強制する部品ではなく、必要な場合だけ取り込む設計です。

詳しくは [再利用UIコンポーネント](docs/COMPONENTS.ja.md) を参照してください。

## セキュリティとプライバシー

初期テンプレートは実行時通信をCSPで遮断します。GitHub Pages版は最初にHTMLを取得しますが、その後のアプリ処理はページ内で完結します。完全にネットワークを切って使う場合は、生成された `dist/index.html` または `dist/index.self-extract.html` をローカルで開いてください。

静的検査だけで完全性を証明することはできません。公開前にブラウザーの開発者ツールでも通信がないことを確認してください。

## ライセンス

Copyright © 2026 ttomohisa

このテンプレートは [MIT License](LICENSE) で公開されています。テンプレートから作ったアプリでは、作者名と第三者ライセンス表記を適切に更新してください。

- 右上の「使い方と注意事項」ダイアログを標準装備
