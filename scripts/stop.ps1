<#
.SYNOPSIS
    Stops anything this repository left running, so a build can overwrite its output.

.DESCRIPTION
    The symptom this fixes:

        Could not copy "...\Chronicle.Domain.dll" to "bin\Debug\net10.0\..."
        Exceeded retry count of 10. The file is locked by: "Chronicle.Portfolio.Server (26644)"

    A running server holds its dependencies open, so the next build cannot replace them.
    Normally the AppHost stops its children when it stops - the usual cause of a straggler
    is the AppHost being force-killed, or its terminal being closed, so it never got the
    chance to clean up.

    Only processes whose executable lives inside THIS repository are stopped. A .NET
    server from another solution, or an unrelated Node process, is left alone - which is
    why this matches on path rather than on process name.

.EXAMPLE
    ./scripts/stop.ps1

.NOTES
    Prefer Ctrl+C in the AppHost's own terminal. That shuts everything down in order and
    makes this script unnecessary. Reach for this when something has already been orphaned.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$stopped = 0

function Stop-Owned {
    param([int]$ProcessId, [string]$Label)

    try {
        Stop-Process -Id $ProcessId -Force -ErrorAction Stop
        Write-Host "  stopped $Label ($ProcessId)"
        return $true
    }
    catch {
        # Already gone between listing and stopping, which is the state we wanted anyway.
        Write-Host "  could not stop $Label ($ProcessId): $($_.Exception.Message)"
        return $false
    }
}

Write-Host "Looking for processes under $repoRoot"

# The .NET side: the AppHost and anything it launched from this repository's output.
foreach ($process in Get-Process -ErrorAction SilentlyContinue) {
    $path = $null
    try { $path = $process.Path } catch { continue }   # access denied on system processes

    if ($path -and $path.StartsWith($repoRoot, [StringComparison]::OrdinalIgnoreCase)) {
        if (Stop-Owned -ProcessId $process.Id -Label $process.ProcessName) { $stopped++ }
    }
}

# The Node side. node.exe lives in Program Files, so its path says nothing about who
# started it - the command line is the only thing that identifies it as ours.
$client = Join-Path $repoRoot 'src\Chronicle.Portfolio\Chronicle.Portfolio.Client'
foreach ($node in Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue) {
    # -like rather than String.Contains: Windows PowerShell 5.1 runs on .NET Framework,
    # whose Contains has no StringComparison overload. -like is case-insensitive anyway.
    if ($node.CommandLine -and $node.CommandLine -like "*$client*") {
        if (Stop-Owned -ProcessId $node.ProcessId -Label 'node') { $stopped++ }
    }
}

if ($stopped -eq 0) {
    Write-Host "Nothing was running. If a build still reports a locked file, the process"
    Write-Host "holding it belongs to something else - the error message names it."
}
else {
    Write-Host "Stopped $stopped process(es). The build should succeed now."
}
