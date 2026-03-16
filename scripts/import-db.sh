#!/usr/bin/env bash
# =============================================================================
#  MotoQFox — Import de datos a nueva base de datos PostgreSQL
#
#  USO:
#    bash import-db.sh motoqfox_data_20260316_120000.sql
#
#  PREREQUISITOS:
#    1. PostgreSQL instalado y corriendo
#    2. Base de datos creada: createdb -U postgres motoqfox_db
#    3. Migraciones aplicadas: python manage.py migrate
# =============================================================================

set -euo pipefail

# ── Configuración ─────────────────────────────────────────────────────────────
DB_NAME="motoqfox_db"
DB_USER="postgres"
DB_PASS="emanuel"
DB_HOST="localhost"
DB_PORT="5432"

# Ruta a los binarios de PostgreSQL (ajustar si cambia la versión)
PG_BIN="/c/Program Files/PostgreSQL/17/bin"
PSQL="$PG_BIN/psql.exe"

# Leer archivo de entrada
if [ $# -eq 0 ]; then
  echo "ERROR: Especifica el archivo SQL a importar."
  echo "Uso: bash import-db.sh motoqfox_data_YYYYMMDD_HHMMSS.sql"
  exit 1
fi

SQL_FILE="$1"

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: Archivo no encontrado: $SQL_FILE"
  exit 1
fi

export PGPASSWORD="$DB_PASS"

echo "=================================================="
echo "  MotoQFox — Import de datos"
echo "  Base de datos : $DB_NAME"
echo "  Archivo       : $SQL_FILE"
echo "=================================================="
echo ""

# Verificar conexión
echo "  Verificando conexión a PostgreSQL..."
"$PSQL" -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 \
  || { echo "ERROR: No se pudo conectar a $DB_NAME. ¿Ya corriste 'python manage.py migrate'?"; exit 1; }
echo "  ✅ Conexión OK"
echo ""

# Cargar datos
echo "  Cargando datos..."
"$PSQL" \
  -U "$DB_USER" \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -d "$DB_NAME" \
  -v ON_ERROR_STOP=0 \
  -f "$SQL_FILE"

echo ""
echo "=================================================="
echo "  ✅ Import completado"
echo "=================================================="
echo ""
echo "  Verifica que los datos están correctos:"
echo "    psql -U postgres -d $DB_NAME -c \"SELECT table_name, (xpath('/row/cnt/text()', xml_count))[1]::text::int AS row_count FROM (SELECT table_name, query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') AS xml_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') t ORDER BY table_name;\""
echo ""

unset PGPASSWORD
