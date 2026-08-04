# Single HTML App Template

[English README](README.md)

LLMと人が、**配布物が1つのHTMLだけで完結するブラウザーアプリ**を継続的に作るためのGitHubリポジトリテンプレートです。

PDF Organizerで採用した「開発用HTMLから、固定バージョンの外部ライブラリ、Worker、WASM、フォント、補助素材までビルド時に内包し、GitHub Pagesへ公開する」考え方を、特定アプリに依存しない形へ整理しています。

![Single HTML App Templateの画面](assets/screenshot.png)

## このテンプレートの特徴

- 最終成果物は `dist/index.html` の1ファイル
- Windowsでは `build-standalone.bat` をダブルクリックしてビルド可能
- PythonやNode.jsは不要
- npmパッケージのバージョンを固定し、必要ファイルだけをBase64で内包
- パッケージtarballと各内包ファイルのSHA-256を記録
- 実行時のCDN、外部フォント、API、分析タグを使わない
- `connect-src 'none'` のContent Security Policy
- GitHub ActionsでPull Requestのビルド検証とGitHub Pages公開
- 日英UI、ライト・ダーク、スマートフォン、キーボード操作の基本実装
- LLM向けの `AGENTS.md`、仕様書 `APP_SPEC.md`、推奨プロンプトを同梱

## 最初に確認するファイル

| ファイル | 役割 |
| --- | --- |
| `AGENTS.md` | LLMが最初に読む実装契約 |
| `APP_SPEC.md` | 作るアプリの目的、機能、受入条件 |
| `app.config.json` | アプリ名、slug、バージョン、説明 |
| `dependencies.json` | 内包するnpmパッケージとファイル |
| `src/index.template.html` | 編集するアプリ本体 |
| `build-standalone.ps1` | 完全内包HTMLの生成 |
| `docs/LLM_WORKFLOW.ja.md` | LLMへ依頼する手順 |

## 新しいアプリを作る

1. GitHubでこのリポジトリをテンプレートとして有効化します。
2. **Use this template** から新しいリポジトリを作成します。
3. `APP_SPEC.md` を新しいアプリの具体的な仕様へ書き換えます。
4. `app.config.json` を変更します。
5. LLMへ `AGENTS.md` から読むよう指示します。
6. 実装後、Windowsで `build-standalone.bat` を実行します。
7. `dist/index.html` を直接開き、ネットワークを切った状態でも主要機能を確認します。

そのまま使える依頼文は [LLMでアプリを作る手順](docs/LLM_WORKFLOW.ja.md) にあります。

## ローカルビルド

Windows 10/11で `build-standalone.bat` をダブルクリックします。

```text
build-standalone.bat
```

依存パッケージをキャッシュから削除して再取得する場合：

```text
build-standalone.bat -ForceDownload
```

生成物：

```text
dist/
├─ index.html
├─ dependency-manifest.json
└─ .nojekyll
```

`dist/index.html` は生成物です。直接編集せず、`src/index.template.html` を変更して再ビルドしてください。

## 外部ライブラリを内包する

`dependencies.json` に固定バージョンと必要ファイルを記載します。初期状態は依存ゼロなので、初回ビルドは通信なしで完了します。

設定例は `examples/dependencies.dayjs.json`、詳しい読み込み方法は [依存ライブラリの追加](docs/DEPENDENCIES.md) を参照してください。

ビルド処理はnpm公式レジストリからtarballを取得し、指定ファイルだけをHTMLへ内包します。実行時にCDNへアクセスすることはありません。

## GitHub Pages

`.github/workflows/deploy-pages.yml` は `main` へのpushごとに次を行います。

1. Windows runnerで完全内包HTMLを生成
2. 外部ランタイム参照と未置換プレースホルダーを検査
3. `dist` をGitHub Pagesへ公開

リポジトリのPages設定では、公開元にGitHub Actionsを選択してください。

## リポジトリ構成

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

## セキュリティとプライバシー

初期テンプレートは実行時通信をCSPで遮断します。GitHub Pages版は最初にHTMLを取得しますが、その後のアプリ処理はページ内で完結します。完全にネットワークを切って使う場合は、生成された `dist/index.html` をローカルで開いてください。

静的検査だけで完全性を証明することはできません。公開前にブラウザーの開発者ツールでも通信がないことを確認してください。

## ライセンス

Copyright © 2026 ttomohisa

このテンプレートは [MIT License](LICENSE) で公開されています。テンプレートから作ったアプリでは、作者名と第三者ライセンス表記を適切に更新してください。
