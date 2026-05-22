"""
Datos de prueba para STAGING (idempotente, usa get_or_create).
Crea lo necesario para probar TODOS los flujos de correo:

  - Categorías, fabricantes y 3 productos con stock  → probar venta + ticket por correo.
  - Un cliente con perfil + su moto                  → probar servicio del taller + avisos de estatus.
  - Una categoría y un servicio de catálogo          → para cotizar el servicio.

Se ejecuta en el arranque de staging (railway.toml). Uso manual: python seed_test_data.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal

from branches.models import Sede
from users.models import CustomUser
from inventory.models import Categoria, MarcaFabricante, Producto, Stock
from customers.models import ClienteProfile
from taller.models import MotoCliente
from catalogo_servicios.models import CategoriaServicio, CatalogoServicio

sede = Sede.objects.filter(name='Sucursal Central').first() or Sede.objects.first()
if not sede:
    print('[seed_test] No hay sede; corre seed_dev primero.')
    raise SystemExit(0)
print(f'[seed_test] Sede: {sede.name}')

# ── Productos (para probar venta + ticket) ──────────────────────────────────
cat_motor, _     = Categoria.objects.get_or_create(name='Motor')
cat_frenos, _    = Categoria.objects.get_or_create(name='Frenos')
cat_electrico, _ = Categoria.objects.get_or_create(name='Eléctrico')

ngk, _    = MarcaFabricante.objects.get_or_create(name='NGK',       defaults={'pais': 'Japón'})
brembo, _ = MarcaFabricante.objects.get_or_create(name='Brembo',    defaults={'pais': 'Italia'})
honda, _  = MarcaFabricante.objects.get_or_create(name='OEM Honda', defaults={'tipo': MarcaFabricante.TipoMarca.OEM, 'pais': 'Japón'})

PRODUCTOS = [
    ('BUJ-NGK-001', 'Bujía NGK CR7HSA',          Decimal('85.00'),  Decimal('45.00'),  cat_motor,  ngk),
    ('BAL-BRE-002', 'Balatas Brembo delanteras', Decimal('320.00'), Decimal('180.00'), cat_frenos, brembo),
    ('ACE-HON-003', 'Aceite Honda 10W-30 1L',    Decimal('150.00'), Decimal('95.00'),  cat_motor,  honda),
]
for sku, name, price, cost, categoria, fabricante in PRODUCTOS:
    prod, _ = Producto.objects.get_or_create(
        sku=sku,
        defaults={'name': name, 'price': price, 'cost': cost,
                  'categoria': categoria, 'marca_fabricante': fabricante},
    )
    stock, _ = Stock.objects.get_or_create(producto=prod, sede=sede, defaults={'quantity': 50})
    print(f'[seed_test] producto {prod.sku} - {prod.name} | stock {stock.quantity}')

# ── Cliente con perfil + moto (para probar servicio del taller) ─────────────
cust = CustomUser.objects.filter(email='customer@motoqfox.com').first()
if cust:
    perfil, _ = ClienteProfile.objects.get_or_create(usuario=cust, defaults={'telefono': '5550001234'})
    moto, _ = MotoCliente.objects.get_or_create(
        cliente=perfil, marca='Italika', modelo='FT150', **{'año': 2022},
        defaults={'placa': 'ABC-123', 'color': 'Rojo'},
    )
    print(f'[seed_test] cliente {cust.email} | moto {moto.marca} {moto.modelo}')
else:
    print('[seed_test] No existe customer@motoqfox.com (seed_dev).')

# ── Catálogo de servicios (para cotizar un servicio) ────────────────────────
cat_serv, _ = CategoriaServicio.objects.get_or_create(nombre='Mantenimiento')
serv, _ = CatalogoServicio.objects.get_or_create(
    nombre='Cambio de aceite y afinación',
    defaults={'precio_base': Decimal('450.00'), 'categoria': cat_serv,
              'duracion_estimada_minutos': 60},
)
print(f'[seed_test] servicio de catálogo: {serv.nombre}')
print('[seed_test] Datos de prueba listos.')
