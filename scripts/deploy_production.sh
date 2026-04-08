#!/usr/bin/env bash
# =============================================================================
#  MotoQFox — Script de despliegue a producción
#
#  Ejecuta los 3 pasos necesarios para dejar la BD de producción lista:
#    1. Importa el dump SQL con los datos reales
#    2. Aplica migraciones nuevas (si las hay)
#    3. Puebla datos de la segunda sucursal y el catálogo de servicios
#
#  PRERREQUISITOS:
#    - Variable de entorno DATABASE_URL configurada (Railway la provee)
#    - Python + Django instalados (manage.py accesible)
#    - El dump SQL debe estar en scripts/ o se pasa como argumento
#
#  USO LOCAL (desarrollo/staging):
#    bash scripts/deploy_production.sh
#    bash scripts/deploy_production.sh scripts/motoqfox_data_20260320.sql
#
#  USO EN RAILWAY (Procfile o Release Command):
#    cd backend && python manage.py migrate && python manage.py seed_segunda_sede
#
# =============================================================================

set -euo pipefail

# ── Configuración ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Dump a importar — usa el argumento o el más reciente en scripts/
if [[ $# -ge 1 ]]; then
  DUMP_FILE="$1"
else
  # Tomar el dump más reciente por nombre (orden lexicográfico)
  DUMP_FILE=$(ls -1 "$SCRIPT_DIR"/motoqfox_data_*.sql 2>/dev/null | sort | tail -n 1)
fi

echo "============================================================"
echo "  MotoQFox — Deploy a producción"
echo "  Dump   : ${DUMP_FILE:-'(ninguno)'}"
echo "  Backend: $BACKEND_DIR"
echo "============================================================"
echo ""

# ── Paso 1: Importar dump ─────────────────────────────────────────────────────
if [[ -z "${DUMP_FILE:-}" ]]; then
  echo "⚠  No se encontró ningún dump SQL en scripts/."
  echo "   Saltando la importación — asume que la BD ya tiene datos."
  echo ""
elif [[ ! -f "$DUMP_FILE" ]]; then
  echo "❌ Archivo no encontrado: $DUMP_FILE"
  exit 1
else
  echo "=== [1/3] Importando dump: $(basename "$DUMP_FILE") ==="

  # Railway provee DATABASE_URL. Para uso local se puede usar las vars de .env
  if [[ -n "${DATABASE_URL:-}" ]]; then
    psql "$DATABASE_URL" -f "$DUMP_FILE"
  else
    # Fallback: leer .env del backend
    if [[ -f "$BACKEND_DIR/.env" ]]; then
      export $(grep -v '^#' "$BACKEND_DIR/.env" | grep -E '^DB_' | xargs)
    fi
    PGPASSWORD="${DB_PASSWORD:-12345}" psql \
      -U "${DB_USER:-postgres}" \
      -h "${DB_HOST:-localhost}" \
      -p "${DB_PORT:-5432}" \
      -d "${DB_NAME:-motoqfox_db}" \
      -f "$DUMP_FILE"
  fi
  echo "  ✓ Dump importado"
  echo ""
fi

# ── Paso 2: Migraciones ───────────────────────────────────────────────────────
echo "=== [2/3] Aplicando migraciones ==="
cd "$BACKEND_DIR"
python manage.py migrate --run-syncdb
echo "  ✓ Migraciones aplicadas"
echo ""

# ── Paso 3: Seed segunda sucursal ────────────────────────────────────────────
echo "=== [3/3] Seed segunda sucursal ==="
python manage.py seed_segunda_sede
echo ""

echo "============================================================"
echo "  ✅ Producción lista"
echo "============================================================"
echo ""
echo "  Próximos pasos:"
echo "  1. Accede al Django admin y edita los datos placeholder:"
echo "     · Datos fiscales de Sucursal Norte"
echo "     · Nombres/emails/passwords de los 6 usuarios nuevos"
echo "     · Stock inicial si los valores no coinciden con la realidad"
echo "     · Precios de servicios de sede 2"
echo ""
echo "  2. Verifica el login de cada rol nuevo:"
echo "     · encargado.norte@motoqfox.com  / Encargado1234!"
echo "     · cajero.norte@motoqfox.com     / Cashier1234!"
echo "     · jefemecanico.norte@motoqfox.com / JefeMec1234!"
echo "     · mecanico1.norte@motoqfox.com  / Mecanico1234!"
echo "     · worker.norte@motoqfox.com     / Worker1234!"
echo ""
