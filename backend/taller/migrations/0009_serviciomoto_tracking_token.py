import uuid
from django.db import migrations, models


def generar_tracking_tokens(apps, schema_editor):
    """Asigna un UUID único a cada fila existente."""
    ServicioMoto = apps.get_model('taller', 'ServicioMoto')
    for servicio in ServicioMoto.objects.all():
        servicio.tracking_token = uuid.uuid4()
        servicio.save(update_fields=['tracking_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0008_serviciomoto_archivado_serviciomoto_archivado_por_and_more'),
    ]

    operations = [
        # Paso 1: agregar nullable sin unique
        migrations.AddField(
            model_name='serviciomoto',
            name='tracking_token',
            field=models.UUIDField(
                null=True,
                blank=True,
                editable=False,
                verbose_name='Token de seguimiento público',
            ),
        ),
        # Paso 2: poblar UUIDs únicos en filas existentes
        migrations.RunPython(generar_tracking_tokens, migrations.RunPython.noop),
        # Paso 3: hacer NOT NULL + UNIQUE
        migrations.AlterField(
            model_name='serviciomoto',
            name='tracking_token',
            field=models.UUIDField(
                default=uuid.uuid4,
                unique=True,
                editable=False,
                verbose_name='Token de seguimiento público',
            ),
        ),
    ]
