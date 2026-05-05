# PdfService

Servicio PDF con HTTPS via nginx reverse proxy.

## Requisitos

- Docker Desktop
- Certificado SSL (`.crt` + `.key`)

---

## Configuración

### 1. Crear el archivo `.env`

Copiar el archivo de ejemplo y completar con los valores del entorno:

```bash
cp .env.example .env
```

Editar `.env`:

```env
# Rutas a los certificados SSL (absolutas)
SSL_CERT_PATH=C:/https/certificados/2026/server.crt
SSL_KEY_PATH=C:/https/certificados/2026/server.key

# Puertos expuestos en el host
PORT_HTTP=8874
PORT_HTTPS=8875
```

### 2. Crear el archivo de contraseña del certificado

Si el certificado `.key` tiene contraseña, crear este archivo:

```bash
# En Windows (PowerShell)
echo "tu-contraseña" > nginx/ssl_password.txt

# En Linux/Mac
echo "tu-contraseña" > nginx/ssl_password.txt
```

> Si el certificado **no tiene contraseña**, dejar el archivo vacío o eliminar la línea `ssl_password_file` de `nginx/nginx.conf`.

---

## Levantar el servicio

```bash
docker compose up -d
```

Verificar que los contenedores estén corriendo:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs -f
```

---

## Acceso

| Protocolo | URL |
|-----------|-----|
| HTTP (redirige a HTTPS) | `http://localhost:${PORT_HTTP}` |
| HTTPS | `https://localhost:${PORT_HTTPS}` |

Con los valores por defecto:

- `http://localhost:8874` → redirige a HTTPS
- `https://localhost:8875` → PdfService

---

## Detener el servicio

```bash
docker compose down
```

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SSL_CERT_PATH` | Ruta absoluta al certificado `.crt` | `C:/https/cert/server.crt` |
| `SSL_KEY_PATH` | Ruta absoluta a la clave privada `.key` | `C:/https/cert/server.key` |
| `PORT_HTTP` | Puerto HTTP en el host | `8874` |
| `PORT_HTTPS` | Puerto HTTPS en el host | `8875` |

---

## Estructura del proyecto

```
PdfService/
├── backend/                # Flask API (solo /api/*)
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Angular 21 + Tailwind 4
│   ├── src/
│   ├── public/             # fonts + lib (pdf.js, Sortable.js)
│   ├── Dockerfile          # multi-stage: build Angular -> nginx
│   └── package.json
├── nginx/
│   ├── nginx.conf          # SSL + proxy /api -> backend + serve Angular
│   └── ssl_password.txt    # Contraseña certificado (NO commitear)
├── .env                    # Variables (NO commitear)
├── .env.example
├── .gitignore
└── docker-compose.yml
```
