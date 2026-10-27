$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$up = Join-Path $root '.tmp\skills-upstream\skills'
$local = Join-Path $root '.agents\skills'
$report = Join-Path $root '.tmp\skills-diff-report.txt'
$lines = New-Object System.Collections.Generic.List[string]

function Get-RelFiles($base) {
  Get-ChildItem $base -Recurse -File | ForEach-Object {
    $_.FullName.Substring($base.Length + 1).Replace('\', '/')
  }
}

function Normalize-Content($path) {
  $t = [System.IO.File]::ReadAllText($path)
  $t = $t -replace "`r`n", "`n"
  $t = $t -replace '(?m)^version: [0-9.]+$', 'version: X'
  return $t
}

$localFiles = @(Get-RelFiles $local)
$upFiles = @(Get-RelFiles $up)

# Map local icon .png to upstream .svg equivalent
$localByKey = @{}
foreach ($f in $localFiles) {
  $key = $f -replace '/assets/remotion-icon\.png$', '/assets/remotion-icon.svg'
  $localByKey[$key] = $f
}
$upSet = @{}
foreach ($f in $upFiles) { $upSet[$f] = $true }

$added = New-Object System.Collections.Generic.List[string]
foreach ($f in $upFiles) { if (-not $localByKey.ContainsKey($f)) { $added.Add($f) } }
$removed = New-Object System.Collections.Generic.List[string]
foreach ($k in $localByKey.Keys) { if (-not $upSet.ContainsKey($k)) { $removed.Add($localByKey[$k]) } }

$changed = New-Object System.Collections.Generic.List[object]
foreach ($f in $upFiles) {
  if (-not $localByKey.ContainsKey($f)) { continue }
  $lf = $localByKey[$f]
  if ([System.IO.Path]::GetExtension($lf) -eq '.png') { continue }
  $lp = Join-Path $local ($lf -replace '/', '\')
  $uppath = Join-Path $up ($f -replace '/', '\')
  $lh = (Get-FileHash $lp -Algorithm SHA256).Hash
  $uh = (Get-FileHash $uppath -Algorithm SHA256).Hash
  if ($lh -ne $uh) {
    $versionOnly = ((Normalize-Content $lp) -eq (Normalize-Content $uppath))
    $changed.Add([pscustomobject]@{ Path = $f; Local = $lf; LocalSize = (Get-Item $lp).Length; UpSize = (Get-Item $uppath).Length; VersionOnly = $versionOnly })
  }
}

$lines.Add("=== SKILLS DIFF: local .agents/skills (4.0.513) vs upstream remotion-dev/skills main (4.0.538) ===")
$lines.Add("local files: $($localFiles.Count)   upstream files: $($upFiles.Count)")
$lines.Add("added (upstream only): $($added.Count)")
$lines.Add("removed (local only): $($removed.Count)")
$lines.Add("changed: $($changed.Count)  (version-only: $(($changed | Where-Object VersionOnly).Count))")
$lines.Add("")
$lines.Add("=== ADDED (present upstream, missing locally) ===")
$added | Sort-Object | ForEach-Object { $lines.Add($_) }
$lines.Add("")
$lines.Add("=== REMOVED (present locally, gone upstream) ===")
$removed | Sort-Object | ForEach-Object { $lines.Add($_) }
$lines.Add("")
$lines.Add("=== CHANGED ===")
$changed | Sort-Object Path | ForEach-Object { $lines.Add(("{0}  [{1}] {2} -> {3} bytes, {4}" -f $_.Path, ($(if ($_.VersionOnly) { 'version-only' } else { 'CONTENT' })), $_.LocalSize, $_.UpSize, '')) }
$lines.Add("")
$lines.Add("=== CHANGED CONTENT (not version-only) ===")
$changed | Where-Object { -not $_.VersionOnly } | Sort-Object Path | ForEach-Object { $lines.Add($_.Path) }

$lines -join "`n" | Set-Content -Path $report -Encoding UTF8
Write-Output "report written: $report"
Get-Content $report
