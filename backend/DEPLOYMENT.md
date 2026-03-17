# Despliegue MotoQFox en Railway

## Pre-requisitos
- Cuenta en Railway (railway.app)
- Repositorio en GitHub

## Variables de entorno requeridas
Ver `.env.example` para la lista completa.

## Pasos de despliegue

### Backend Django
1. Crear nuevo proyecto en Railway
2. Conectar repositorio GitHub
3. Agregar servicio PostgreSQL
4. Configurar variables de entorno (copiar de .env.example)
5. Railway genera HTTPS automáticamente con dominio `.railway.app`

### Configuración Django para producción
Agregar al settings.py para forzar HTTPS:
```python
# Solo en producción
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
```

### Frontend React
1. Crear segundo servicio en Railway
2. Build command: `npm run build`
3. Output directory: `dist`
4. Configurar `VITE_API_URL` apuntando al backend Railway

## PDF Generation
Actualmente usa `threading.Thread(daemon=True)`. Para producción de alto volumen considera migrar a Celery + Redis (Railway tiene addon Redis).

## Checklist pre-producción
- [ ] SECRET_KEY generada con `python -c "import secrets; print(secrets.token_urlsafe(50))"`
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS configurado
- [ ] CORS_ALLOWED_ORIGINS configurado
- [ ] Base de datos PostgreSQL en Railway
- [ ] Email configurado (Gmail App Password o SendGrid)
- [ ] HTTPS automático via Railway ✓
