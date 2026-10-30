$ErrorActionPreference = 'Stop'
if ($PSVersionTable.PSVersion.Major -lt 7) { throw 'This optional launcher needs PowerShell 7.' }
$recordPath = Join-Path $PSScriptRoot '.runtime\processes.json'
if (-not (Test-Path -LiteralPath $recordPath)) { Write-Output 'No launcher process record exists.'; return }
$record = Get-Content -LiteralPath $recordPath -Raw | ConvertFrom-Json
if ($record.root -ne $PSScriptRoot) { throw 'The process record belongs to another project path.' }
foreach ($entry in @(@{id=$record.backend;kind='backend'},@{id=$record.frontend;kind='frontend'})) {
    $processId = [int]$entry.id
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if (-not $process) { continue }
    $matchesProject = if ($entry.kind -eq 'backend') {
        $process.Path -eq $record.backendPath -and $process.StartTime.ToUniversalTime().Ticks.ToString() -eq $record.backendTicks
    } else {
        $process.Path -eq $record.frontendPath -and $process.StartTime.ToUniversalTime().Ticks.ToString() -eq $record.frontendTicks
    }
    if (-not $matchesProject) { throw "Process $processId no longer matches this project. It was not stopped." }
    $process.Kill($true)
    $process.WaitForExit(5000) | Out-Null
}
Remove-Item -LiteralPath $recordPath
Write-Output 'AgriBovix launcher processes stopped.'
