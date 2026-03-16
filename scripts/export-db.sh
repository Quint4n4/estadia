#!/usr/bin/env bash
# =============================================================================
#  MotoQFox — Export de datos de PostgreSQL
#  Genera un archivo SQL con INSERT statements de todas las tablas del sistema.
#  Compatible con otra instancia de PostgreSQL con el mismo schema.
#
#  USO:
#    bash export-db.sh                  → genera motoqfox_data_YYYYMMDD.sql
#    bash export-db.sh -o mi_archivo.sql → nombre personalizado
#
#  CARGA EN OTRA BASE DE DATOS (después de hacer migrate):
#    psql -U postgres -d motoqfox_db -f motoqfox_data_YYYYMMDD.sql
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
PG_DUMP="$PG_BIN/pg_dump.exe"
PSQL="$PG_BIN/psql.exe"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="motoqfox_data_${TIMESTAMP}.sql"

# Parsear argumento -o
while getopts "o:" opt; do
  case $opt in
    o) OUTPUT_FILE="$OPTARG" ;;
    *) echo "Uso: $0 [-o archivo.sql]"; exit 1 ;;
  esac
done

export PGPASSWORD="$DB_PASS"

echo "=================================================="
echo "  MotoQFox — Export de datos"
echo "  Base de datos : $DB_NAME"
echo "  Archivo       : $OUTPUT_FILE"
echo "=================================================="
echo ""

# ── Orden de tablas (respeta foreign keys) ────────────────────────────────────
# Las tablas sin dependencias van primero.
TABLES=(
  # Django internals
  "django_content_type"
  "auth_permission"
  "auth_group"

  # Usuarios y sedes (base de todo)
  "branches_sedes"
  "users"
  "users_turnos"
  "users_login_audit_log"
  "users_password_reset_tokens"

  # Inventario — catálogo YMM
  "inventory_marcas_fabricante"
  "inventory_categorias"
  "inventory_subcategorias"
  "inventory_marcas_moto"
  "inventory_modelos_moto"
  "inventory_productos"
  "inventory_compatibilidad_pieza"
  "inventory_stock"
  "inventory_entradas"
  "inventory_auditorias"
  "inventory_auditoria_items"

  # Clientes
  "customers_perfiles"

  # Ventas y caja
  "sales_codigos_apertura"
  "sales_aperturas_caja"
  "sales_ventas"
  "sales_venta_items"
  "sales_reportes_caja"

  # Pedidos a bodega
  "pedidos_bodega"
  "pedidos_bodega_items"

  # Taller
  "taller_motos_cliente"
  "taller_servicios"
  "taller_servicio_items"
  "taller_solicitudes_extra"

  # Facturación
  "billing_config_fiscal_sede"
)

# ── Generar encabezado del archivo SQL ────────────────────────────────────────
cat > "$OUTPUT_FILE" << SQL
-- =============================================================================
--  MotoQFox — Dump de datos
--  Generado : $(date "+%Y-%m-%d %H:%M:%S")
--  Base     : $DB_NAME @ $DB_HOST:$DB_PORT
--
--  INSTRUCCIONES DE CARGA:
--  1. Asegúrate de que la base de datos destino ya tiene el schema aplicado:
--       python manage.py migrate
--  2. Ejecuta este script:
--       psql -U postgres -d motoqfox_db -f $OUTPUT_FILE
--  3. Actualiza las secuencias (ver sección al final del archivo).
-- =============================================================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Desactivar constraints temporalmente para evitar errores de orden
SET session_replication_role = replica;

SQL

# ── Exportar datos tabla por tabla ────────────────────────────────────────────
TOTAL=${#TABLES[@]}
COUNT=0

for TABLE in "${TABLES[@]}"; do
  COUNT=$((COUNT + 1))

  # Verificar que la tabla existe
  EXISTS=$("$PSQL" -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -tAc \
    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$TABLE');")

  if [ "$EXISTS" != "t" ]; then
    echo "  [$COUNT/$TOTAL] ⚠  $TABLE — no existe, se omite"
    continue
  fi

  # Contar filas
  ROWS=$("$PSQL" -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -tAc \
    "SELECT COUNT(*) FROM $TABLE;")

  printf "  [%2d/%d] %-45s %s filas\n" "$COUNT" "$TOTAL" "$TABLE" "$ROWS"

  if [ "$ROWS" -eq 0 ]; then
    echo "-- Tabla $TABLE: sin datos" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    continue
  fi

  # Agregar separador en el SQL
  cat >> "$OUTPUT_FILE" << SQL

-- -----------------------------------------------------------------------------
-- Tabla: $TABLE  ($ROWS filas)
-- -----------------------------------------------------------------------------
SQL

  # Exportar solo datos (--data-only --inserts)
  "$PG_DUMP" \
    -U "$DB_USER" \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -d "$DB_NAME" \
    --data-only \
    --inserts \
    --no-privileges \
    --no-owner \
    -t "$TABLE" \
    >> "$OUTPUT_FILE"

done

# ── Reactivar constraints y actualizar secuencias ─────────────────────────────
cat >> "$OUTPUT_FILE" << 'SQL'

-- =============================================================================
--  Reactivar constraints
-- =============================================================================
SET session_replication_role = DEFAULT;

-- =============================================================================
--  Actualizar secuencias (auto-increment)
--  Ejecutar después de cargar los datos para que los nuevos registros
--  no colisionen con los IDs importados.
-- =============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      tc.table_name,
      kcu.column_name,
      pg_get_serial_sequence(tc.table_name, kcu.column_name) AS seq_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.columns c
      ON kcu.table_name = c.table_name
      AND kcu.column_name = c.column_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND c.column_default LIKE 'nextval%'
      AND tc.table_schema = 'public'
  LOOP
    IF r.seq_name IS NOT NULL THEN
      EXECUTE format(
        'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 0) + 1, false)',
        r.seq_name, r.column_name, r.table_name
      );
    END IF;
  END LOOP;
END $$;

SQL

# ── Resumen final ─────────────────────────────────────────────────────────────
FILE_SIZE=$(du -sh "$OUTPUT_FILE" | cut -f1)

echo ""
echo "=================================================="
echo "  ✅ Export completado"
echo "  Archivo : $OUTPUT_FILE"
echo "  Tamaño  : $FILE_SIZE"
echo "=================================================="
echo ""
echo "  Para cargar en otra base de datos:"
echo "  1. Crear la BD y correr migraciones:"
echo "     createdb -U postgres motoqfox_db"
echo "     python manage.py migrate"
echo ""
echo "  2. Cargar los datos:"
echo "     psql -U postgres -d motoqfox_db -f $OUTPUT_FILE"
echo ""

unset PGPASSWORD
