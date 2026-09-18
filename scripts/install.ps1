<#
.SYNOPSIS
    Links every skill in this repo into ~/.claude/skills using directory junctions.
.DESCRIPTION
    Each folder in skills/ that contains a SKILL.md is linked as ~/.claude/skills/<name>.
    Because it is a link, edits in the repo are live in Claude Code without reinstalling.
    Nothing is downloaded and no other files are touched.
    -Uninstall removes only the links that point into this repo; skill contents are never deleted.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\install.ps1
    powershell -ExecutionPolicy Bypass -File scripts\install.ps1 -Uninstall
#>
param([switch]$Uninstall)

$ErrorActionPreference = 'Stop'

$repoSkills = Join-Path (Split-Path $PSScriptRoot -Parent) 'skills'
$userSkills = Join-Path $env:USERPROFILE '.claude\skills'

function Get-LinkTarget([string]$Path) {
    $item = Get-Item -LiteralPath $Path -Force
    if ($item.LinkType -notin 'Junction', 'SymbolicLink') { return $null }
    return ([string]@($item.Target)[0]).TrimEnd('\')
}

if ($Uninstall) {
    if (-not (Test-Path -LiteralPath $userSkills)) { return }
    foreach ($item in Get-ChildItem -LiteralPath $userSkills -Directory -Force) {
        $target = Get-LinkTarget $item.FullName
        if ($target -and $target.StartsWith($repoSkills + '\', [StringComparison]::OrdinalIgnoreCase)) {
            # Non-recursive delete removes the link itself, never the target contents.
            [System.IO.Directory]::Delete($item.FullName)
            Write-Host "removed  $($item.Name)"
        }
    }
    return
}

New-Item -ItemType Directory -Force -Path $userSkills | Out-Null

foreach ($skill in Get-ChildItem -LiteralPath $repoSkills -Directory) {
    if (-not (Test-Path -LiteralPath (Join-Path $skill.FullName 'SKILL.md'))) { continue }
    $link = Join-Path $userSkills $skill.Name

    if (Test-Path -LiteralPath $link) {
        if ((Get-LinkTarget $link) -eq $skill.FullName) {
            Write-Host "ok       $($skill.Name)"
        } else {
            Write-Warning "$link already exists and is not a link to this repo; skipped."
        }
        continue
    }

    New-Item -ItemType Junction -Path $link -Target $skill.FullName | Out-Null
    Write-Host "linked   $($skill.Name) -> $link"
}
