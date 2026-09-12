[CmdletBinding()]
param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = 'Stop'

if ($BackendOnly -and $FrontendOnly) {
    throw 'Chi duoc chon mot trong hai: -BackendOnly hoac -FrontendOnly'
}

$root = $PSScriptRoot
$frontendDir = Join-Path $root 'src\frontend'

$runBackend = -not $FrontendOnly
$runFrontend = -not $BackendOnly

Write-Host '=== Storage Management - Dev Mode ===' -ForegroundColor Cyan

if ($runBackend) {
    if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
        throw 'Khong tim thay Java trong PATH. Can cai JDK 25 tro len.'
    }

    Write-Host '[Backend] http://localhost:8088/api/v1' -ForegroundColor Green
    Write-Host '[Backend] Swagger: http://localhost:8088/api/v1/swagger-ui.html' -ForegroundColor Green
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $root -ArgumentList @(
        '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', '.\mvnw.cmd spring-boot:run'
    )
}

if ($runFrontend) {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw 'Khong tim thay Node.js trong PATH.'
    }

    if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
        Write-Host '[Frontend] Dang cai dat dependencies...' -ForegroundColor Yellow
        Start-Process -FilePath 'npm.cmd' -WorkingDirectory $frontendDir -ArgumentList 'install' -Wait
    }

    Write-Host '[Frontend] http://localhost:5173' -ForegroundColor Green
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $frontendDir -ArgumentList @(
        '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', 'npm run dev'
    )
}

Write-Host 'Da khoi dong. Dong cua so tuong ung de dung.' -ForegroundColor Cyan
