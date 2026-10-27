$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$up = Join-Path $root '.tmp\skills-upstream\skills'
$local = Join-Path $root '.agents\skills'
$numstatOut = Join-Path $root '.tmp\skills-numstat.txt'
$diffOut = Join-Path $root '.tmp\skills-content.diff'

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
$localByKey = @{}
foreach ($f in $localFiles) {
  $key = $f -replace '/assets/remotion-icon\.png$', '/assets/remotion-icon.svg'
  $localByKey[$key] = $f
}

$numstat = New-Object System.Collections.Generic.List[string]
$diffs = New-Object System.Collections.Generic.List[string]

foreach ($f in ($upFiles | Sort-Object)) {
  if (-not $localByKey.ContainsKey($f)) { continue }
  $lf = $localByKey[$f]
  if ([System.IO.Path]::GetExtension($lf) -eq '.png') { continue }
  $lp = Join-Path $local ($lf -replace '/', '\')
  $uppath = Join-Path $up ($f -replace '/', '\')
  if ((Get-FileHash $lp).Hash -eq (Get-FileHash $uppath).Hash) { continue }
  if ((Normalize-Content $lp) -eq (Normalize-Content $uppath)) {
    $numstat.Add("version-only`t$f")
    continue
  }
  $out = & git diff --no-index --no-color --unified=2 -- "$lp" "$uppath" 2>&1
  $text = ($out | Out-String)
  $added = 0; $removed = 0
  foreach ($ln in ($out -split "`n")) {
    if ($ln -match '^\+[^+]') { $added++ }
    elseif ($ln -match '^-[^-]') { $removed++ }
  }
  $numstat.Add(("{0}`t+{1} -{2}`t{3}" -f $f, $added, $removed, ''))
  $diffs.Add("########################################################################")
  $diffs.Add("## FILE: $f")
  $diffs.Add("########################################################################")
  $diffs.Add($text)
}
$numstat -join "`n" | Set-Content -Path $numstatOut -Encoding UTF8
$diffs -join "`n" | Set-Content -Path $diffOut -Encoding UTF8
Write-Output "numstat: $numstatOut"
Write-Output "diff: $diffOut"
Get-Content $numstatOut
