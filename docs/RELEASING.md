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
