$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
. (Join-Path $repoRoot 'scripts\embed-ui-conventions.ps1')
$components = Join-Path $repoRoot 'components'
$fixture = '<style>__BK_UI_CSS__</style><script>__BK_UI_JS__</script>'
$result = Expand-BrowserKittyUI -Template $fixture -ComponentsPath $components
if ($result.Contains('__BK_UI_') -or -not $result.Contains('BrowserKittyUI')) { throw 'UI embedding did not produce inline assets.' }
foreach ($bad in @('__BK_UI_JS__', ($fixture + '__BK_UI_CSS__'))) {
  $rejected = $false
  try { $null = Expand-BrowserKittyUI -Template $bad -ComponentsPath $components } catch { $rejected = $true }
  if (-not $rejected) { throw 'UI embedding must reject missing or duplicate placeholders.' }
}
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('bk-ui-embed-' + [guid]::NewGuid().ToString('N'))
try {
  New-Item -ItemType Directory -Path $testRoot | Out-Null
  foreach ($name in @('ui-conventions.js', 'ui-conventions.css', 'ui-conventions.lock.json')) { Copy-Item -LiteralPath (Join-Path $components $name) -Destination (Join-Path $testRoot $name) }
  [System.IO.File]::AppendAllText((Join-Path $testRoot 'ui-conventions.css'), '/* drift */')
  $rejected = $false
  try { $null = Expand-BrowserKittyUI -Template $fixture -ComponentsPath $testRoot } catch { $rejected = $_.Exception.Message.Contains('hash mismatch') }
  if (-not $rejected) { throw 'UI embedding must reject hash drift.' }
} finally {
  foreach ($name in @('ui-conventions.js', 'ui-conventions.css', 'ui-conventions.lock.json')) { Remove-Item -LiteralPath (Join-Path $testRoot $name) -Force -ErrorAction SilentlyContinue }
  if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Force }
}
Write-Host '[OK] UI embed tests passed: exact pins, substitution, missing/duplicate markers, drift rejection.'
