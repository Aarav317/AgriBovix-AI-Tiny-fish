$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$pythonPath = Join-Path $projectRoot '.venv\Scripts\python.exe'
$vitePath = Join-Path $projectRoot 'frontend\node_modules\vite\bin\vite.js'
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'

if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "Project Python environment not found at $pythonPath. Create the project .venv and install backend\requirements-lock.txt."
}
if (-not (Test-Path -LiteralPath $vitePath)) {
    throw "Frontend dependencies not found at $vitePath. Install frontend dependencies with npm ci."
}
$node = Get-Command node.exe -ErrorAction SilentlyContinue
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $node -or -not $npm) {
    throw 'Node.js and npm are required. Install the supported Node.js version, then run this launcher again.'
}
& $pythonPath -c 'import fastapi, uvicorn'
if ($LASTEXITCODE -ne 0) {
    throw 'Backend dependencies are incomplete. Install backend\requirements-lock.txt into the project .venv.'
}

$backendListeners = @(Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)
$frontendListeners = @(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue)
$backendReady = $false
$frontendReady = $false

if ($backendListeners.Count -gt 0) {
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 3
        $backendReady = $health.status -eq 'ok'
    } catch [System.Net.WebException] {
        $backendReady = $false
    }
    if (-not $backendReady) {
        throw 'Port 8000 is occupied by a service that is not this project backend. Stop that service or resolve the port conflict, then retry.'
    }
}
if ($frontendListeners.Count -gt 0) {
    try {
        $page = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/' -TimeoutSec 3
        $frontendReady = $page.StatusCode -eq 200 -and $page.Content -match 'AgriBovix'
    } catch [System.Net.WebException] {
        $frontendReady = $false
    }
    if (-not $frontendReady) {
        throw 'Port 3000 is occupied by a service that is not this project frontend. Stop that service or resolve the port conflict, then retry.'
    }
}

if (-not $backendReady) {
    $backendCommand = "`$Host.UI.RawUI.WindowTitle = 'AgriBovix AI - Backend'; Set-Location -LiteralPath '$($backendPath.Replace("'", "''"))'; & '$($pythonPath.Replace("'", "''"))' -m uvicorn run:application --host 127.0.0.1 --port 8000"
    $encodedBackend = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($backendCommand))
    Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList @('-NoExit', '-EncodedCommand', $encodedBackend) -WorkingDirectory $backendPath
}
if (-not $frontendReady) {
    $frontendCommand = "`$Host.UI.RawUI.WindowTitle = 'AgriBovix AI - Frontend'; Set-Location -LiteralPath '$($frontendPath.Replace("'", "''"))'; & '$($npm.Source.Replace("'", "''"))' run dev"
    $encodedFrontend = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($frontendCommand))
    Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList @('-NoExit', '-EncodedCommand', $encodedFrontend) -WorkingDirectory $frontendPath
}

Write-Output 'AgriBovix AI is available at http://127.0.0.1:3000/'
Write-Output 'Backend API docs: http://127.0.0.1:8000/docs'
Write-Output 'Backend and frontend run in separate visible PowerShell windows. Press Ctrl+C in each window to stop its server.'
