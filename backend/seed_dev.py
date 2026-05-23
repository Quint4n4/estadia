"""
Script de datos de prueba para desarrollo.
Crea una sede y un usuario por cada rol.

Uso:
    python manage.py shell < seed_dev.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from branches.models import Sede
from users.models import CustomUser

# ── Sede de prueba ────────────────────────────────────────────────────────────
sede, created = Sede.objects.get_or_create(
    name='Sucursal Central',
    defaults={
        'address': 'Av. Moto 100, Col. Centro',
        'phone': '555-0001',
    }
)
print(f"{'Sede creada' if created else 'Sede ya existía'}: {sede.name}")

# ── Usuarios por rol ──────────────────────────────────────────────────────────
USERS = [
    {
        'email': 'admin@motoqfox.com',
        'first_name': 'Admin',
        'last_name': 'Sistema',
        'role': CustomUser.Role.ADMINISTRATOR,
        'sede': None,
        'password': 'Admin1234!',
    },
    {
        'email': 'encargado@motoqfox.com',
        'first_name': 'Elena',
        'last_name': 'Encargada',
        'role': CustomUser.Role.ENCARGADO,
        'sede': sede,
        'password': 'Encargado1234!',
    },
    {
        'email': 'worker@motoqfox.com',
        'first_name': 'Carlos',
        'last_name': 'Mecánico',
        'role': CustomUser.Role.WORKER,
        'sede': sede,
        'password': 'Worker1234!',
    },
    {
        'email': 'cashier@motoqfox.com',
        'first_name': 'María',
        'last_name': 'Cajera',
        'role': CustomUser.Role.CASHIER,
        'sede': sede,
        'password': 'Cashier1234!',
    },
    {
        'email': 'customer@motoqfox.com',
        'first_name': 'Luis',
        'last_name': 'Cliente',
        'role': CustomUser.Role.CUSTOMER,
        'sede': None,
        'password': 'Customer1234!',
    },
]

for u in USERS:
    password = u.pop('password')
    obj, created = CustomUser.objects.get_or_create(
        email=u['email'],
        defaults=u
    )
    # Idempotente: en cada corrida restablece contraseña, rol y sede a los
    # valores conocidos. Así staging nunca queda con credenciales perdidas
    # ni cuentas bloqueadas tras pruebas de cambio de contraseña.
    obj.set_password(password)
    obj.role = u['role']
    obj.sede = u['sede']
    # Liberar cualquier bloqueo por intentos fallidos previos
    for campo, valor in (('login_attempts', 0), ('locked_until', None), ('is_active', True)):
        if hasattr(obj, campo):
            setattr(obj, campo, valor)
    obj.save()
    print(f"  [{'creado' if created else 'reset'}]  [{obj.role:15}] {obj.email}  pass: {password}")

print("\n¡Listo! Credenciales de prueba (se restablecen en cada deploy):")
print("  admin@motoqfox.com      / Admin1234!      → /admin")
print("  encargado@motoqfox.com  / Encargado1234!  → /encargado (control de cajas)")
print("  worker@motoqfox.com     / Worker1234!     → /worker")
print("  cashier@motoqfox.com    / Cashier1234!    → /cashier")
print("  customer@motoqfox.com   / Customer1234!   → (sin panel)")
