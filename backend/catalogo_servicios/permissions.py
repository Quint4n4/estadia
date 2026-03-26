from rest_framework.permissions import BasePermission


class EsAdministrador(BasePermission):
    """Solo usuarios con rol ADMINISTRATOR pueden acceder."""
    message = 'Se requiere rol de administrador para esta acción.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'role')
            and request.user.role == 'ADMINISTRATOR'
        )


class EsAdministradorOEncargado(BasePermission):
    """Administradores y encargados pueden acceder."""
    message = 'Se requiere rol de administrador o encargado.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'role')
            and request.user.role in ('ADMINISTRATOR', 'ENCARGADO')
        )
