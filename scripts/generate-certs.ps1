# Genera certificados SSL autofirmados para desarrollo local en Windows.
$certsDir = Join-Path $PSScriptRoot "certs"
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir | Out-Null
}

if (Get-Command openssl -ErrorAction SilentlyContinue) {
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
      -keyout "$certsDir/server.key" `
      -out "$certsDir/server.crt" `
      -subj "/C=AR/ST=Buenos Aires/L=Buenos Aires/O=PdfService/CN=localhost"
    Write-Host "Certificados de prueba generados en ./scripts/certs" -ForegroundColor Green
    Write-Host "Recordá actualizar tu archivo .env apuntando a estas rutas." -ForegroundColor Green
} else {
    Write-Host "No se encontró OpenSSL en el sistema." -ForegroundColor Red
    Write-Host "Instalá OpenSSL o usá Git Bash para correr el script .sh." -ForegroundColor Yellow
}
