import re
from django.core.exceptions import ValidationError


LETRAS_PATTERN = re.compile(r'^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-\/]+$')


def validar_solo_letras(value):
    """Valida que el valor solo contenga letras, espacios y guiones."""
    if not LETRAS_PATTERN.match(value.strip()):
        raise ValidationError(
            'Este campo solo puede contener letras, espacios y guiones. No se permiten números ni caracteres especiales.'
        )
