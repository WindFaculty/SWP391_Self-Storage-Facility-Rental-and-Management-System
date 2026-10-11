# Run from any directory: powershell -ExecutionPolicy Bypass -File .\run.ps1
# Requires Java 25+, Node.js/npm and MySQL or Docker Desktop.
# Database settings: backend/src/main/resources/application-local.yml or DB_* env vars.
[CmdletBinding()]
param([switch] $SmokeTest)

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
        throw "Port $Port is already in use (PID $($listener[0].OwningProcess)). A server may already be running. Open http://localhost:5173 or press Ctrl+C in the previous run.ps1 terminal before starting again."
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
    # Keep the process handle so Windows PowerShell can read ExitCode after exit.
    $null = $process.Handle
    $process | Add-Member -NotePropertyName ServerName -NotePropertyValue $Name
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

    # Google downloads stay local/Git-ignored; credentials are passed only in child-process environment.
    $googleCredentialFiles = @(Get-ChildItem -LiteralPath $projectRoot -File -Filter 'client_secret*.json')
    if ($googleCredentialFiles.Count -gt 1) {
        throw 'Multiple Google credential files found. Keep one local web client file or configure GOOGLE_CLIENT_ID/SECRET explicitly.'
    }
    if ($googleCredentialFiles.Count -eq 1 -and -not $env:GOOGLE_CLIENT_ID -and -not $env:GOOGLE_CLIENT_SECRET) {
        try {
            $googleLocalClient = (Get-Content -Raw -LiteralPath $googleCredentialFiles[0].FullName | ConvertFrom-Json).web
        } catch {
            throw 'Cannot parse the local Google credential JSON. Download a valid Web application client file.'
        }
        if (-not $googleLocalClient.client_id -or -not $googleLocalClient.client_secret) {
            throw 'Google credential file must contain a Web application client ID and secret.'
        }
        $googleLocalRedirect = 'http://localhost:8088/api/v1/login/oauth2/code/google'
        if ($googleLocalClient.redirect_uris -notcontains $googleLocalRedirect) {
            throw 'Google client must authorize http://localhost:8088/api/v1/login/oauth2/code/google.'
        }
        Set-RunEnvironment 'GOOGLE_CLIENT_ID' $googleLocalClient.client_id
        Set-RunEnvironment 'GOOGLE_CLIENT_SECRET' $googleLocalClient.client_secret
        if (-not $env:GOOGLE_REDIRECT_URI) { Set-RunEnvironment 'GOOGLE_REDIRECT_URI' $googleLocalRedirect }
        if (-not $env:GOOGLE_LOGIN_ENABLED) { Set-RunEnvironment 'GOOGLE_LOGIN_ENABLED' 'true' }
        Write-Host 'Google OAuth configured from local ignored credential file (secret not displayed).'
        $googleLocalClient = $null
    }

    if (-not $env:DB_URL -and -not (Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue)) {
        if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
            throw 'MySQL is not listening on port 3306. Start MySQL or install and start Docker Desktop.'
        }
        Write-Host 'Starting local MySQL with Docker...'
        & docker compose -p storage-local -f (Join-Path $projectRoot 'infra/docker/compose.local.yml') up -d --wait --wait-timeout 180
        if ($LASTEXITCODE -ne 0) {
            throw 'Could not start local MySQL. Make sure Docker Desktop is running.'
        }
    }

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
                foreach ($suffix in @('stdout', 'stderr')) {
                    $log = Join-Path $logDirectory "$($process.ServerName).$suffix.log"
                    if (Test-Path -LiteralPath $log) { Get-Content -LiteralPath $log -Tail 25 | Write-Host }
                }
                throw "$($process.ServerName) exited with code $($process.ExitCode). Check the logs in $logDirectory."
            }
        }
        if (-not $ready) {
            $backendListening = Get-NetTCPConnection -LocalPort 8088 -State Listen -ErrorAction SilentlyContinue
            $frontendListening = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
            if ($backendListening -and $frontendListening) {
                try {
                    $null = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8088/api/v1/facilities' -TimeoutSec 5
                    $null = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173' -TimeoutSec 5
                } catch {
                    if ([DateTime]::UtcNow -gt $deadline) { throw "Servers opened their ports but HTTP checks failed: $($_.Exception.Message)" }
                    Start-Sleep -Seconds 1
                    continue
                }
                $ready = $true
                Write-Host 'Frontend: http://localhost:5173' -ForegroundColor Green
                Write-Host 'Backend:  http://localhost:8088/api/v1' -ForegroundColor Green
                Write-Host 'Swagger:  http://localhost:8088/api/v1/swagger-ui.html'
                if ($SmokeTest) {
                    Write-Host 'Smoke test passed: frontend and backend returned successful HTTP responses.' -ForegroundColor Green
                    break
                }
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
