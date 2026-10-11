# Run from any directory: powershell -ExecutionPolicy Bypass -File .\run.ps1
# Requires Java 25+, Node.js/npm and a running MySQL instance.
# Database settings: backend/src/main/resources/application-local.yml or DB_* env vars.
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$backendDirectory = Join-Path $projectRoot 'backend'
$frontendDirectory = Join-Path $projectRoot 'frontend'
$logDirectory = Join-Path $projectRoot '.run'
$processes = @()
$savedEnvironment = @{}

function Assert-PortFree([int] $Port) {
    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listener) {
        throw "Port $Port is already in use. Stop that server before running this script."
    }
}

function Set-RunEnvironment([string] $Name, [string] $Value) {
    $savedEnvironment[$Name] = [Environment]::GetEnvironmentVariable($Name, 'Process')
    [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
}

function Start-DevServer([string] $Name, [string] $Directory, [string] $Command) {
    $stdout = Join-Path $logDirectory "$Name.stdout.log"
    $stderr = Join-Path $logDirectory "$Name.stderr.log"
    $process = Start-Process -FilePath $env:ComSpec -ArgumentList @('/d', '/s', '/c', $Command) `
        -WorkingDirectory $Directory -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    return $process
}

try {
    foreach ($command in @('java', 'npm.cmd')) {
        if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
            throw "Required command '$command' was not found in PATH."
        }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $backendDirectory 'mvnw.cmd'))) {
        throw 'Backend Maven wrapper was not found.'
    }
    Assert-PortFree 8088
    Assert-PortFree 5173

    if (-not (Test-Path -LiteralPath (Join-Path $frontendDirectory 'node_modules'))) {
        Write-Host 'Installing frontend dependencies...'
        Push-Location $frontendDirectory
        try {
            & npm.cmd ci
            if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
        } finally {
            Pop-Location
        }
    }

    New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
    Set-RunEnvironment 'SERVER_PORT' '8088'
    Set-RunEnvironment 'SPRING_PROFILES_ACTIVE' 'local'
    if (-not $env:VNPAY_RETURN_URL) {
        Set-RunEnvironment 'VNPAY_RETURN_URL' 'http://localhost:8088/api/v1/payments/vnpay/return'
    }

    Write-Host 'Starting backend and frontend...'
    $processes += Start-DevServer 'backend' $backendDirectory 'mvnw.cmd spring-boot:run'
    $processes += Start-DevServer 'frontend' $frontendDirectory 'npm.cmd run dev -- --port 5173 --strictPort'
    Write-Host "Logs: $logDirectory"
    Write-Host 'Press Ctrl+C to stop both servers.'

    $deadline = [DateTime]::UtcNow.AddMinutes(3)
    $ready = $false
    while ($true) {
        foreach ($process in $processes) {
            $process.Refresh()
            if ($process.HasExited) {
                throw "A server exited with code $($process.ExitCode). Check the logs in $logDirectory."
            }
        }
        if (-not $ready) {
            $backendListening = Get-NetTCPConnection -LocalPort 8088 -State Listen -ErrorAction SilentlyContinue
            $frontendListening = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
            if ($backendListening -and $frontendListening) {
                $ready = $true
                Write-Host 'Frontend: http://localhost:5173' -ForegroundColor Green
                Write-Host 'Backend:  http://localhost:8088/api/v1' -ForegroundColor Green
                Write-Host 'Swagger:  http://localhost:8088/api/v1/swagger-ui.html'
            } elseif ([DateTime]::UtcNow -gt $deadline) {
                throw "Servers did not start within 3 minutes. Check MySQL, Java 25 and logs in $logDirectory."
            }
        }
        Start-Sleep -Seconds 1
    }
} finally {
    foreach ($process in $processes) {
        $process.Refresh()
        if (-not $process.HasExited) {
            # Stop the shell and its Maven/Java or npm/Node child processes.
            & taskkill.exe /PID $process.Id /T /F 2>&1 | Out-Null
        }
    }
    foreach ($name in $savedEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $savedEnvironment[$name], 'Process')
    }
}
