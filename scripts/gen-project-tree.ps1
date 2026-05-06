$ErrorActionPreference = 'SilentlyContinue'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$excludeNames = @(
    'node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__', '.turbo', '.cache'
)

function Get-TreeLines {
    param([string]$Dir, [string]$Prefix)
    $lines = @()
    $dirs = Get-ChildItem -LiteralPath $Dir -Directory | Where-Object { $excludeNames -notcontains $_.Name } | Sort-Object Name
    $files = Get-ChildItem -LiteralPath $Dir -File | Where-Object { $excludeNames -notcontains $_.Name } | Sort-Object Name
    $all = @($dirs) + @($files)
    for ($i = 0; $i -lt $all.Count; $i++) {
        $item = $all[$i]
        $isLast = ($i -eq $all.Count - 1)
        # Single-quoted so the leading grave accent is literal (tree corner).
        $branch = if ($isLast) { '`-- ' } else { '+-- ' }
        $lines += $Prefix + $branch + $item.Name
        if ($item.PSIsContainer) {
            $childPrefix = $Prefix + $(if ($isLast) { '    ' } else { '|   ' })
            $lines += Get-TreeLines -Dir $item.FullName -Prefix $childPrefix
        }
    }
    return $lines
}

$fence = '```'
$out = @()
$out += $fence
$out += (Split-Path $root -Leaf)
$out += Get-TreeLines -Dir $root -Prefix ''
$out += $fence
$out -join [Environment]::NewLine
