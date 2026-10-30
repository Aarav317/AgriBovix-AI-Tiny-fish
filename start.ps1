$ErrorActionPreference = 'Stop'
if ($PSVersionTable.PSVersion.Major -lt 7) { throw 'The optional launcher needs PowerShell 7. Use the two-terminal commands in README.md with Windows PowerShell.' }
$projectRoot = $PSScriptRoot
$runtimePath = Join-Path $projectRoot '.runtime'
$pythonPath = Join-Path $projectRoot '.venv\Scripts\python.exe'
$vitePath = Join-Path $projectRoot 'frontend\node_modules\vite\bin\vite.js'
if (-not (Test-Path -LiteralPath $pythonPath) -or -not (Test-Path -LiteralPath $vitePath)) {
    throw 'Install dependencies first. Follow the Windows setup in README.md.'
}
foreach ($port in @(3000, 8000)) {
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($listener) { throw "Port $port is already in use. Stop the existing server before using this launcher." }
}
New-Item -ItemType Directory -Force -Path $runtimePath | Out-Null
$nodePath = (Get-Command node.exe).Source
$quotedVitePath = '"' + $vitePath + '"'
$backendProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-m','uvicorn','run:application','--host','127.0.0.1','--port','8000') -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimePath 'backend.log') -RedirectStandardError (Join-Path $runtimePath 'backend-error.log')
try {
    $frontendProcess = Start-Process -FilePath $nodePath -ArgumentList @($quotedVitePath,'--host','127.0.0.1') -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimePath 'frontend.log') -RedirectStandardError (Join-Path $runtimePath 'frontend-error.log')
} catch {
    Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
    throw
}
@{backend=$backendProcess.Id;frontend=$frontendProcess.Id;root=$projectRoot;backendPath=$backendProcess.Path;frontendPath=$frontendProcess.Path;backendTicks=$backendProcess.StartTime.ToUniversalTime().Ticks.ToString();frontendTicks=$frontendProcess.StartTime.ToUniversalTime().Ticks.ToString()} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimePath 'processes.json')
Write-Output 'AgriBovix AI is starting: http://127.0.0.1:3000/'
Write-Output 'API: http://127.0.0.1:8000/docs'
Write-Output 'Local logs: .runtime. Run ./stop.ps1 to stop these servers.'
