"""
Comando: assign_customer_sedes
==============================
Asigna una sede a todos los usuarios CUSTOMER que aún no tienen sede asignada.

Uso:
    python manage.py assign_customer_sedes <sede_id>
    python manage.py assign_customer_sedes <sede_id> --dry-run   # solo muestra, no guarda

Ejemplos:
    python manage.py assign_customer_sedes 1          # asigna Sucursal Central
    python manage.py assign_customer_sedes 2          # asigna Sucursal Norte
    python manage.py assign_customer_sedes 1 --dry-run
"""
from django.core.management.base import BaseCommand, CommandError
from users.models import CustomUser
from branches.models import Sede


class Command(BaseCommand):
    help = 'Asigna una sede a todos los clientes que no tienen sede asignada.'

    def add_arguments(self, parser):
        parser.add_argument(
            'sede_id',
            type=int,
            help='ID de la sede a asignar (ver lista con --list-sedes)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué clientes serían afectados sin guardar cambios.',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Sobreescribe la sede incluso en clientes que ya tienen una asignada.',
        )

    def handle(self, *args, **options):
        sede_id  = options['sede_id']
        dry_run  = options['dry_run']
        all_mode = options['all']

        # Verificar que la sede existe
        try:
            sede = Sede.objects.get(id=sede_id, is_active=True)
        except Sede.DoesNotExist:
            sedes_activas = Sede.objects.filter(is_active=True).values_list('id', 'name')
            self.stdout.write(self.style.ERROR(f'Sede con id={sede_id} no encontrada o inactiva.'))
            self.stdout.write('Sedes disponibles:')
            for sid, sname in sedes_activas:
                self.stdout.write(f'  [{sid}] {sname}')
            raise CommandError('Sede inválida.')

        # Clientes a actualizar
        qs = CustomUser.objects.filter(role='CUSTOMER')
        if not all_mode:
            qs = qs.filter(sede__isnull=True)

        count = qs.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS(
                'No hay clientes sin sede asignada. '
                'Usa --all para sobreescribir todos.'
            ))
            return

        # Mostrar lista de afectados
        self.stdout.write(f'\nSede destino: [{sede.id}] {sede.name}')
        self.stdout.write(f'Clientes a actualizar: {count}\n')
        for u in qs.order_by('id'):
            self.stdout.write(f'  [{u.id}] {u.get_full_name() or u.email} — sede actual: {u.sede.name if u.sede else "—"}')

        if dry_run:
            self.stdout.write(self.style.WARNING('\n[dry-run] No se guardaron cambios.'))
            return

        # Confirmar
        self.stdout.write('')
        confirm = input(f'¿Confirmar asignación de {count} clientes a "{sede.name}"? [s/N]: ')
        if confirm.lower() not in ('s', 'si', 'sí', 'y', 'yes'):
            self.stdout.write(self.style.WARNING('Operación cancelada.'))
            return

        # Ejecutar
        updated = qs.update(sede=sede)
        self.stdout.write(self.style.SUCCESS(
            f'\n✓ {updated} clientes actualizados → [{sede.id}] {sede.name}'
        ))
