"""
Comando: seed_segunda_sede
==========================
Puebla todos los datos faltantes de la Sucursal Norte (sede_id=2):

  - ConfiguracionFiscalSede
  - Stock completo para los 20 productos actuales
  - 6 usuarios (ENCARGADO, CASHIER, JEFE_MECANICO, 2 MECANICO, WORKER)
  - CategoriaServicio + CatalogoServicio (18 servicios base)
  - PrecioServicioSede para sede 2 (replica precio_base como override)

El comando es IDEMPOTENTE: usa get_or_create en todos lados.
Correrlo dos veces no duplica registros.

Uso:
    python manage.py seed_segunda_sede
    python manage.py seed_segunda_sede --dry-run   # muestra que crearia sin guardar
"""
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


# ---------------------------------------------------------------------------
#  Datos de seed
# ---------------------------------------------------------------------------

# Stock inicial para sede 2 (producto_id: (cantidad, cantidad_minima))
# Los que ya existen en el dump se respetan (get_or_create no sobreescribe).
STOCK_SEDE2 = {
    1:  (50, 5),   # Pastilla delantera AHL
    2:  (50, 5),   # Pastilla trasera AHL
    3:  (80, 5),   # Bujia NGK            <- ya existe qty=80, no sobreescribir
    4:  (40, 5),   # Filtro aceite Italika
    5:  (30, 5),   # Cadena 428H          <- ya existe qty=70, no sobreescribir
    6:  (25, 3),   # Kit cadena + pinones
    7:  (60, 5),   # Aceite Motul 4T      <- ya existe qty=99, no sobreescribir
    8:  (60, 5),   # Aceite Bardahl       <- ya existe qty=98, no sobreescribir
    9:  (40, 5),   # Amortiguador trasero <- ya existe qty=100, no sobreescribir
    10: (20, 3),   # Disco freno delantero
    11: (20, 3),   # Carburador PB16      <- ya existe qty=100, no sobreescribir
    12: (40, 5),   # Cable clutch Italika <- ya existe qty=100, no sobreescribir
    13: (30, 3),   # Bateria YTX5L-BS     <- ya existe qty=50, no sobreescribir
    14: (30, 5),   # Filtro aire Italika
    15: (15, 2),   # Kit empaques motor
    16: (10, 2),   # Piston STD FT125
    17: (20, 3),   # Llanta delantera
    18: (20, 3),   # Llanta trasera
    19: (40, 5),   # CDI Italika          <- ya existe qty=100, no sobreescribir
    20: (15, 2),   # Kit frenos completo
}

# Usuarios para sede 2 (placeholders - editar antes de abrir al publico)
USUARIOS_SEDE2 = [
    {
        'email':      'encargado.norte@motoqfox.com',
        'first_name': 'Roberto',
        'last_name':  'Gonzalez',
        'role':       'ENCARGADO',
        'phone':      '7440000001',
        'password':   'Encargado1234!',
    },
    {
        'email':      'cajero.norte@motoqfox.com',
        'first_name': 'Laura',
        'last_name':  'Perez',
        'role':       'CASHIER',
        'phone':      '7440000002',
        'password':   'Cashier1234!',
    },
    {
        'email':      'jefemecanico.norte@motoqfox.com',
        'first_name': 'Miguel',
        'last_name':  'Ruiz',
        'role':       'JEFE_MECANICO',
        'phone':      '7440000003',
        'password':   'JefeMec1234!',
    },
    {
        'email':      'mecanico1.norte@motoqfox.com',
        'first_name': 'Andres',
        'last_name':  'Lopez',
        'role':       'MECANICO',
        'phone':      '7440000004',
        'password':   'Mecanico1234!',
    },
    {
        'email':      'mecanico2.norte@motoqfox.com',
        'first_name': 'Hector',
        'last_name':  'Martinez',
        'role':       'MECANICO',
        'phone':      '7440000005',
        'password':   'Mecanico1234!',
    },
    {
        'email':      'worker.norte@motoqfox.com',
        'first_name': 'Sofia',
        'last_name':  'Torres',
        'role':       'WORKER',
        'phone':      '7440000006',
        'password':   'Worker1234!',
    },
]

# Catalogo de servicios
# Formato: (nombre_categoria, [ (nombre_servicio, precio_base, duracion_min), ... ])
CATALOGO = [
    ('Mantenimiento Preventivo', [
        ('Cambio de aceite y filtro',         Decimal('150.00'), 30),
        ('Cambio de bujia',                   Decimal('80.00'),  20),
        ('Ajuste de carburador',              Decimal('200.00'), 45),
        ('Revision general 20 puntos',        Decimal('300.00'), 60),
    ]),
    ('Transmision', [
        ('Cambio de cadena y pinones',        Decimal('350.00'), 60),
        ('Ajuste de clutch',                  Decimal('120.00'), 30),
    ]),
    ('Frenos y Suspension', [
        ('Cambio de pastillas delanteras',    Decimal('180.00'), 45),
        ('Cambio de pastillas traseras',      Decimal('180.00'), 45),
        ('Ajuste de frenos traseros',         Decimal('100.00'), 20),
        ('Cambio de amortiguadores traseros', Decimal('400.00'), 90),
        ('Cambio de llanta delantera',        Decimal('250.00'), 40),
        ('Cambio de llanta trasera',          Decimal('280.00'), 50),
    ]),
    ('Sistema Electrico', [
        ('Diagnostico electrico',             Decimal('200.00'), 60),
        ('Cambio de bateria',                 Decimal('100.00'), 20),
        ('Cambio de bujia de encendido',      Decimal('80.00'),  15),
    ]),
    ('Motor y Mecanica', [
        ('Overhaul de motor 125cc',           Decimal('2500.00'), 480),
        ('Cambio de piston y segmentos',      Decimal('800.00'),  180),
    ]),
    ('Diagnostico y Revision', [
        ('Diagnostico por computadora',       Decimal('250.00'), 45),
    ]),
]


# ---------------------------------------------------------------------------
#  Comando
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = 'Puebla datos de la Sucursal Norte (sede_id=2) y el catalogo de servicios.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra que se crearia sin guardar ningun cambio.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        # Importaciones dentro del metodo para evitar errores de AppRegistry
        from billing.models import ConfiguracionFiscalSede
        from branches.models import Sede
        from catalogo_servicios.models import (
            CatalogoServicio, CategoriaServicio, PrecioServicioSede,
        )
        from inventory.models import Producto, Stock
        from users.models import CustomUser

        if dry_run:
            self.stdout.write(self.style.WARNING('\n[DRY-RUN] No se guardaran cambios.\n'))

        # -- Verificar que sede 2 existe --------------------------------------
        try:
            sede2 = Sede.objects.get(id=2)
        except Sede.DoesNotExist:
            raise CommandError(
                'La Sucursal Norte (sede_id=2) no existe en la base de datos. '
                'Importa el dump primero:\n'
                '  psql $DATABASE_URL -f scripts/motoqfox_data_<fecha>.sql'
            )

        self.stdout.write(f'\nSede destino: [{sede2.id}] {sede2.name}\n')

        counters = {
            'fiscal':     0,
            'stock':      0,
            'usuarios':   0,
            'categorias': 0,
            'servicios':  0,
            'precios':    0,
        }

        with transaction.atomic():
            if dry_run:
                from django.db import connection
                sp = connection.savepoint()

            # -- 1. ConfiguracionFiscalSede -----------------------------------
            self.stdout.write('-' * 55)
            self.stdout.write('1. Configuracion fiscal sede 2')

            cfg, created = ConfiguracionFiscalSede.objects.get_or_create(
                sede=sede2,
                defaults={
                    'nombre_comercial': 'Moto Q Fox - Sucursal Norte',
                    'nombre_legal':     'Moto Q Fox S.A. de C.V.',
                    'rfc':              'MQF000000000',
                    'direccion':        sede2.address or 'Av. Ejido, Colonia Hoogar moderno',
                    'telefono':         sede2.phone   or '7445514025',
                    'email':            'norte@motoqfox.com',
                    'leyenda_ticket':   'Gracias por su compra. Este documento no es una factura fiscal.',
                    'iva_tasa':         Decimal('16.00'),
                },
            )
            if created:
                counters['fiscal'] += 1
                self.stdout.write(self.style.SUCCESS('  [OK] Creada'))
            else:
                self.stdout.write('  [--] Ya existe - omitida')

            # -- 2. Stock -----------------------------------------------------
            self.stdout.write('-' * 55)
            self.stdout.write('2. Stock de productos para sede 2')

            productos_existentes = {
                p.id: p
                for p in Producto.objects.filter(is_active=True, id__in=STOCK_SEDE2.keys())
            }

            for producto_id, (qty, min_qty) in STOCK_SEDE2.items():
                producto = productos_existentes.get(producto_id)
                if not producto:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  [WARN] Producto id={producto_id} no encontrado - omitido'
                        )
                    )
                    continue

                stock, created = Stock.objects.get_or_create(
                    producto=producto,
                    sede=sede2,
                    defaults={'quantity': qty, 'min_quantity': min_qty},
                )
                if created:
                    counters['stock'] += 1
                    self.stdout.write(f'  [OK] {producto.sku} -> {qty} uds')
                else:
                    self.stdout.write(
                        f'  [--] {producto.sku} ya existe ({stock.quantity} uds) - omitido'
                    )

            # -- 3. Usuarios --------------------------------------------------
            self.stdout.write('-' * 55)
            self.stdout.write('3. Usuarios para sede 2')

            for datos in USUARIOS_SEDE2:
                user, created = CustomUser.objects.get_or_create(
                    email=datos['email'],
                    defaults={
                        'first_name': datos['first_name'],
                        'last_name':  datos['last_name'],
                        'role':       datos['role'],
                        'phone':      datos['phone'],
                        'sede':       sede2,
                        'is_active':  True,
                    },
                )
                if created:
                    user.set_password(datos['password'])
                    user.save(update_fields=['password'])
                    counters['usuarios'] += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  [OK] [{datos["role"]:15s}] {datos["email"]}'
                        )
                    )
                else:
                    self.stdout.write(f'  [--] [{datos["role"]:15s}] {datos["email"]} - ya existe')

            # -- 4. Catalogo de servicios -------------------------------------
            self.stdout.write('-' * 55)
            self.stdout.write('4. Catalogo de servicios')

            for nombre_cat, servicios in CATALOGO:
                cat, created_cat = CategoriaServicio.objects.get_or_create(
                    nombre=nombre_cat,
                    defaults={'activo': True},
                )
                if created_cat:
                    counters['categorias'] += 1
                    self.stdout.write(self.style.SUCCESS(f'  [OK] Categoria: {nombre_cat}'))
                else:
                    self.stdout.write(f'  [--] Categoria: {nombre_cat} - ya existe')

                for nombre_srv, precio, duracion in servicios:
                    srv, created_srv = CatalogoServicio.objects.get_or_create(
                        nombre=nombre_srv,
                        defaults={
                            'categoria':                 cat,
                            'precio_base':               precio,
                            'duracion_estimada_minutos': duracion,
                            'activo':                    True,
                        },
                    )
                    if created_srv:
                        counters['servicios'] += 1
                        self.stdout.write(f'      [OK] {nombre_srv} - ${precio}')
                    else:
                        self.stdout.write(f'      [--] {nombre_srv} - ya existe')

            # -- 5. PrecioServicioSede para sede 2 ----------------------------
            self.stdout.write('-' * 55)
            self.stdout.write('5. Precios de servicios para sede 2')

            for servicio in CatalogoServicio.objects.filter(activo=True):
                if servicio.precio_base is None:
                    continue
                precio_sede, created = PrecioServicioSede.objects.get_or_create(
                    servicio=servicio,
                    sede=sede2,
                    defaults={
                        'precio_override': servicio.precio_base,
                        'activo':          True,
                    },
                )
                if created:
                    counters['precios'] += 1
                    self.stdout.write(
                        f'  [OK] {servicio.nombre} -> ${precio_sede.precio_override}'
                    )
                else:
                    self.stdout.write(f'  [--] {servicio.nombre} - ya existe')

            # -- Rollback si dry-run ------------------------------------------
            if dry_run:
                connection.savepoint_rollback(sp)

        # -- Resumen ----------------------------------------------------------
        self.stdout.write('\n' + '=' * 55)
        self.stdout.write(self.style.SUCCESS('=== Seed segunda sucursal completado ==='))
        self.stdout.write('=' * 55)

        label = '[DRY-RUN] Habria creado' if dry_run else 'Creados'
        self.stdout.write(f'{label}:')
        self.stdout.write(f'  Config fiscal : {counters["fiscal"]}')
        self.stdout.write(f'  Stock entries : {counters["stock"]} nuevos')
        self.stdout.write(f'  Usuarios      : {counters["usuarios"]}')
        self.stdout.write(f'  Categorias    : {counters["categorias"]}')
        self.stdout.write(f'  Servicios     : {counters["servicios"]}')
        self.stdout.write(f'  Precios sede 2: {counters["precios"]}')

        if not dry_run and any(counters.values()):
            self.stdout.write(self.style.WARNING(
                '\n[AVISO] RECUERDA editar antes de abrir al publico:\n'
                '  - RFC y datos fiscales de Sucursal Norte\n'
                '    (Admin -> Billing -> Configuraciones fiscales)\n'
                '  - Nombres, emails y passwords de los 6 usuarios nuevos\n'
                '    (Admin -> Users -> Usuarios)\n'
                '  - Stock inicial si los valores no coinciden con la realidad\n'
                '    (Admin -> Inventory -> Stock)\n'
                '  - Precios de servicios para sede 2 si difieren de sede 1\n'
                '    (Admin -> Catalogo servicios -> Precios por sede)\n'
            ))
