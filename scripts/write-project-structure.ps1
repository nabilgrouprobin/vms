$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$tree = & (Join-Path $PSScriptRoot 'gen-project-tree.ps1')
$header = @'
# VMS project structure

Snapshot of the repository layout for documentation and onboarding. Generated and bulky folders are omitted so the tree stays readable.

**Omitted directory names:** `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`, `__pycache__`, `.turbo`, `.cache`

## Refresh this file

Run from the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\write-project-structure.ps1
```

## Tree

'@
$md = $header + [Environment]::NewLine + $tree
$outPath = Join-Path $repoRoot 'PROJECT_STRUCTURE.md'
Set-Content -LiteralPath $outPath -Value $md -Encoding utf8
