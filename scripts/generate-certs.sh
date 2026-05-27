#!/bin/bash
# Genera certificados SSL autofirmados para desarrollo local.

mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/server.key \
  -out certs/server.crt \
  -subj "/C=AR/ST=Buenos Aires/L=Buenos Aires/O=PdfService/CN=localhost"

echo "Certificados de prueba generados en la carpeta ./certs"
echo "Recordá actualizar tu archivo .env apuntando a estas rutas."
