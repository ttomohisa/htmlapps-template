# Release workflow / リリース手順

The template includes an automatic release workflow for configured application repositories.
It is independent of Pages and Cloudflare Preview. The unconfigured starter is deliberately skipped.

1. Set `repository.owner` and `repository.name` in app.config.json to the actual GitHub repository. Set the app slug and stable SemVer (MAJOR.MINOR.PATCH).
2. For every release, bump the version and add a non-empty `docs/releases/vX.Y.Z.md` describing changes, checks, and known limitations. Update CHANGELOG and both READMEs as needed.
3. Open a PR and review the normal build and app-specific tests. PR validation is read-only; only the owner merges.
4. A push to main changing app.config.json, release notes or release tooling starts the release workflow. It rebuilds/verifies the exact commit, packages both standalone variants and SHA256SUMS, and uploads a short-lived CI artifact.
5. A separate main-only job downloads the artifact, verifies the commit/version and hashes, creates the tag at the tested SHA, uploads the three assets to a draft release, then publishes. Existing published releases are skipped; a tag at a different commit is not moved. Retry a failed draft on the same commit using the failed workflow run.

Use a version bump for changes intended for distribution. An existing published version is never replaced. Manual dispatch on main can publish an as-yet-unpublished configured version. A draft interrupted during upload may be resumed for the same commit. Keep the application's actual browser regression suite in the validation job before packaging; the generic repository check does not prove application behavior.

## 日本語

実リポジトリと一致する owner/name を app.config.json に設定したアプリだけが対象です。リリースごとにバージョンを上げ、`docs/releases/vX.Y.Z.md` を PR に含めてください。PR では読み取り権限で検証し、main へのマージ後に検証済みのコミットへタグを作ります。通常版・自己展開版 HTML と SHA256SUMS を下書き Release に添付してから公開します。公開済み Release は上書きせず、別コミットを指すタグは移動しません。中断時は同じコミットの失敗したワークフローを再実行します。アプリ固有のブラウザ回帰検査を公開前の検証ジョブに追加してください。

Development PRs and pushes without versioned notes are still built but not published. A manual release dispatch on main with real repository metadata fails if the versioned notes are missing. This avoids publishing an initial development version simply because a new app sets its repository metadata.

開発中にバージョン別リリースノートが未作成の場合はビルドだけを行い、公開しません。mainからの手動リリースでノートがなければエラーになります。

## Release constraints and verification / 公開条件と検証

Application publishing requires stable SemVer, the actual owner/name, non-empty versioned notes, a readable build and enabled self-extract build. Output paths must be relative to the checkout. The main release job also runs the common unit tests and three browser engines before packaging. Replace the starter-only test files with app-specific checks; retain the same workflow entrypoints or update both workflows. The publish job verifies release notes against the checked-out commit, refuses unexpected assets on a draft, and never modifies a published release. Publish behavior is covered with mocked GitHub API tests; actual repository permissions and a real release still require a configured repository.

アプリの自動公開には安定版SemVer、実リポジトリのowner/name、空でないバージョン別ノート、通常版と有効化した自己展開版が必要です。出力パスはリポジトリ内の相対パスにします。mainのリリース検証では共通単体検査と3ブラウザーの検査も実施します。スターター専用テストをアプリ固有の検査へ置き換え、実行ファイル名を変える場合は両方のワークフローを更新してください。公開処理ではノートをコミットの内容と照合し、想定外の添付物がある下書きは公開せず、公開済みReleaseは変更しません。GitHub APIは模擬テストで検証しますが、実際の公開権限・Release作成は設定済みのリポジトリで確認が必要です。

The template's placeholder repository metadata deliberately skips application publishing. A template-version change alone does not create a GitHub Release. / テンプレート自体の仮リポジトリ設定ではアプリの自動公開は行いません。テンプレートのバージョン変更だけでGitHub Releaseは作成されません。

## Template maintenance release / テンプレート本体のリリース

The template itself keeps placeholder application metadata. Prepare its version in app.config.json, CHANGELOG and a note under `docs/template-releases/` (separate from derived apps' `docs/releases/`). Refresh actual screenshots and the source ZIP, then run the template CI including `python scripts/package-template-source.py --check`. After the maintainer merges, Pages follows its existing deployment workflow. If a versioned GitHub Release is desired for the template itself, the maintainer creates the tag and Release at the verified main commit using the template note and source ZIP. The derived-app workflow deliberately does not publish it automatically.

テンプレート本体はアプリの仮リポジトリ設定を保持します。app.config.json、CHANGELOG、`docs/template-releases/` のノートを更新し（派生アプリ用の `docs/releases/` とは分離）、実スクリーンショットとソースZIPを再生成します。CIでは `python scripts/package-template-source.py --check` も実行します。管理者がマージした後は既存のPages公開フローが動きます。テンプレート本体のバージョン付きGitHub Releaseが必要な場合は、確認済みmainコミットに管理者がタグを作り、テンプレート用ノートとソースZIPでReleaseを作成します。派生アプリ用の自動公開ワークフローはテンプレート自体を公開しません。
