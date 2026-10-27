$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
. (Join-Path $repoRoot 'scripts\embed-ui-conventions.ps1')
$fixture = [System.IO.File]::ReadAllText((Join-Path $repoRoot 'tests\ui-conventions-cascade.template.html'))
$fixture = Expand-BrowserKittyUI -Template $fixture -ComponentsPath (Join-Path $repoRoot 'components')
$outputDirectory = Join-Path $repoRoot 'dist'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$outputPath = Join-Path $outputDirectory 'ui-conventions-cascade.html'
[System.IO.File]::WriteAllText($outputPath, $fixture, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Browser cascade regression fixture: $outputPath"
