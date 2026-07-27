$ErrorActionPreference = "Continue"

function Check-Url {
  param(
    [string] $Name,
    [string] $Url,
    [int[]] $OkStatuses = @(200)
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    if ($OkStatuses -contains [int]$response.StatusCode) {
      Write-Host "OK   $Name -> $($response.StatusCode) $Url"
    } else {
      Write-Host "WARN $Name -> $($response.StatusCode) $Url"
    }
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -and ($OkStatuses -contains [int]$status)) {
      Write-Host "OK   $Name -> $status $Url"
    } else {
      Write-Host "WARN $Name -> $($_.Exception.Message) $Url"
    }
  }
}

Check-Url "Web" "http://localhost:3000/"
Check-Url "API health" "http://localhost:3001/health"
Check-Url "API profiles (requiere login admin)" "http://localhost:3001/streaming/ingest-profiles" @(200, 401)
Check-Url "API runtime (requiere login admin)" "http://localhost:3001/streaming/runtime-status" @(200, 401)
Check-Url "Icecast" "http://localhost:8000/"
Check-Url "MediaMTX API (requiere credenciales)" "http://localhost:9997/v3/paths/list" @(200, 401)
Check-Url "MediaMTX HLS tv (404 si OBS no transmite)" "http://localhost:8888/tv/index.m3u8" @(200, 404)

Write-Host ""
Write-Host "Si HLS tv falla con 404, OBS todavia no esta transmitiendo el path tv."
