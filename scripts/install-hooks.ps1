# Enable repo-local git hooks (strips Cursor Co-authored-by trailers).
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $repoRoot ".githooks\prepare-commit-msg"))) {
	throw "Run from obsidian-daily-preview-calendar repo (missing .githooks)"
}
Set-Location $repoRoot
& git config core.hooksPath .githooks
Write-Host "core.hooksPath set to .githooks"
