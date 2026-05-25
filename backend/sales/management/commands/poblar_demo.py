"""
Comando para poblar datos de DEMOSTRACIÓN (presentación / tesis).

Hace 2 cosas, de forma SEGURA y reversible:
  1) Replica el stock de cada producto activo en TODAS las sedes
     (solo crea el que falta; nunca toca el stock existente).
  2) Genera ventas de demostración repartidas en fechas, en todas las sedes,
     para que las métricas y gráficas se vean con datos.

Todas las ventas generadas se marcan con "[DEMO]" en sus notas, así se pueden
borrar después con:  python manage.py poblar_demo --limpiar

NO modifica ni borra datos existentes. NO descuenta tu stock real.

Ejemplos:
  python manage.py poblar_demo
  python manage.py poblar_demo --ventas-por-sede 50 --dias 120
  python manage.py poblar_demo --force          # genera más aunque ya existan
  python manage.py poblar_demo --limpiar         # borra SOLO las ventas [DEMO]
"""
import random
from decimal import Decimal
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from branches.models import Sede
from inventory.models import Producto, Stock
from users.models import CustomUser
from sales.models import Venta, VentaItem

DEMO_TAG = '[DEMO]'
METODOS = ['EFECTIVO'] * 5 + ['TARJETA'] * 3 + ['TRANSFERENCIA'] * 2


class Command(BaseCommand):
    help = 'Puebla stock en todas las sedes y genera ventas de demostración (marcadas [DEMO]).'

    def add_arguments(self, parser):
        parser.add_argument('--dias', type=int, default=90,
                            help='Días hacia atrás para repartir las ventas (default 90).')
        parser.add_argument('--ventas-por-sede', type=int, default=40,
                            help='Ventas demo por sede, en promedio (default 40).')
        parser.add_argument('--stock', type=int, default=80,
                            help='Cantidad de stock para las sedes que no lo tengan (default 80).')
        parser.add_argument('--force', action='store_true',
                            help='Generar ventas demo aunque ya existan.')
        parser.add_argument('--limpiar', action='store_true',
                            help='Borra SOLO las ventas demo [DEMO] y termina.')

    def handle(self, *args, **opts):
        # ── Modo limpiar ──────────────────────────────────────────────────────
        if opts['limpiar']:
            qs = Venta.objects.filter(notas__icontains=DEMO_TAG)
            n = qs.count()
            qs.delete()  # borra en cascada los VentaItem
            self.stdout.write(self.style.SUCCESS(f'🧹 Borradas {n} ventas demo [DEMO].'))
            return

        sedes = list(Sede.objects.filter(is_active=True))
        productos = list(Producto.objects.filter(is_active=True))
        if not sedes:
            self.stdout.write(self.style.ERROR('No hay sedes activas.'))
            return
        if not productos:
            self.stdout.write(self.style.ERROR('No hay productos activos.'))
            return

        self.stdout.write(f'Sedes activas: {len(sedes)} · Productos activos: {len(productos)}')

        # ── Parte 1: stock en todas las sedes ─────────────────────────────────
        creados = 0
        for p in productos:
            for s in sedes:
                _, created = Stock.objects.get_or_create(
                    producto=p, sede=s,
                    defaults={'quantity': opts['stock'], 'min_quantity': 5},
                )
                if created:
                    creados += 1
        self.stdout.write(self.style.SUCCESS(
            f'📦 Stock: {creados} combinaciones producto×sede creadas '
            f'(las existentes no se tocaron).'
        ))

        # ── Parte 2: ventas demo ──────────────────────────────────────────────
        if Venta.objects.filter(notas__icontains=DEMO_TAG).exists() and not opts['force']:
            self.stdout.write(self.style.WARNING(
                'Ya existen ventas demo. Usa --force para generar más, '
                'o --limpiar para borrarlas.'
            ))
            return

        ahora = timezone.now()
        dias = max(1, opts['dias'])
        base_n = max(1, opts['ventas_por_sede'])
        total_ventas = 0
        resumen = []

        for s in sedes:
            cajero = (
                CustomUser.objects.filter(sede=s, role=CustomUser.Role.CASHIER).first()
                or CustomUser.objects.filter(sede=s).first()
                or CustomUser.objects.filter(role=CustomUser.Role.ADMINISTRATOR).first()
                or CustomUser.objects.first()
            )
            if not cajero:
                self.stdout.write(self.style.WARNING(f'  · {s.name}: sin usuario para cajero, se omite.'))
                continue

            # Productos con stock > 0 en esta sede
            ids_con_stock = set(
                Stock.objects.filter(sede=s, quantity__gt=0).values_list('producto_id', flat=True)
            )
            prods_sede = [p for p in productos if p.id in ids_con_stock] or productos

            # Variar el número de ventas por sede ±30% (para que las sedes difieran)
            n_ventas = random.randint(int(base_n * 0.7), int(base_n * 1.3))
            ingresos_sede = Decimal('0')

            for _ in range(n_ventas):
                with transaction.atomic():
                    metodo = random.choice(METODOS)
                    v = Venta.objects.create(
                        sede=s, cajero=cajero,
                        subtotal=Decimal('0'), descuento=Decimal('0'), total=Decimal('0'),
                        metodo_pago=metodo,
                        monto_pagado=Decimal('0'), cambio=Decimal('0'),
                        status=Venta.Status.COMPLETADA,
                        notas=DEMO_TAG,
                    )

                    elegidos = random.sample(prods_sede, min(random.randint(1, 4), len(prods_sede)))
                    subtotal = Decimal('0')
                    for p in elegidos:
                        qty = random.randint(1, 3)
                        price = p.price or Decimal('0')
                        linea = (price * qty)
                        VentaItem.objects.create(
                            venta=v, tipo=VentaItem.Tipo.PRODUCTO, producto=p,
                            quantity=qty, unit_price=price, subtotal=linea,
                        )
                        subtotal += linea

                    descuento = Decimal('0')
                    if random.random() < 0.15:  # ~15% de ventas con descuento
                        descuento = (subtotal * Decimal('0.10')).quantize(Decimal('0.01'))
                    total = subtotal - descuento

                    if metodo == 'EFECTIVO':
                        extra = Decimal(random.choice([0, 0, 0, 20, 50, 100]))
                        pagado = (total + extra).quantize(Decimal('0.01'))
                    else:
                        pagado = total
                    cambio = pagado - total

                    v.subtotal = subtotal
                    v.descuento = descuento
                    v.total = total
                    v.monto_pagado = pagado
                    v.cambio = cambio
                    v.save(update_fields=['subtotal', 'descuento', 'total', 'monto_pagado', 'cambio'])

                    # Backdate created_at (auto_now_add se salta con update()).
                    # Sesgo a fechas recientes -> tendencia de crecimiento en las gráficas.
                    dias_atras = int(random.triangular(0, dias, 0))
                    fecha = ahora - timedelta(
                        days=dias_atras,
                        hours=random.randint(8, 20),
                        minutes=random.randint(0, 59),
                    )
                    Venta.objects.filter(pk=v.pk).update(created_at=fecha)

                    ingresos_sede += total
                    total_ventas += 1

            resumen.append((s.name, n_ventas, ingresos_sede))

        self.stdout.write(self.style.SUCCESS(f'💰 Generadas {total_ventas} ventas demo:'))
        for nombre, n, ingresos in resumen:
            self.stdout.write(f'   · {nombre}: {n} ventas · ${ingresos:,.2f}')
        self.stdout.write(self.style.SUCCESS(
            '✅ Listo. Para borrarlas después: python manage.py poblar_demo --limpiar'
        ))
