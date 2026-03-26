from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0004_stock_stock_sede_qty_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='auditoriainventario',
            name='motivo',
            field=models.CharField(
                blank=True, default='', max_length=500,
                verbose_name='Motivo de la visita',
            ),
        ),
    ]
