import io
import qrcode
import base64
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ClienteProfile, EmailLog
from .serializers import (
    ClienteRegistroSerializer,
    ClienteProfileSerializer,
    ClienteBusquedaSerializer,
)


def _jwt_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
    }


# ── Registro público ──────────────────────────────────────────────────────────

class RegistroClienteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ClienteRegistroSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        profile = user.cliente_profile
        tokens = _jwt_for_user(user)
        return Response({
            'success': True,
            'message': '¡Bienvenido a MotoQFox!',
            'data': {
                'tokens':  tokens,
                'profile': ClienteProfileSerializer(profile).data,
            },
        }, status=status.HTTP_201_CREATED)


# ── Perfil propio ─────────────────────────────────────────────────────────────

class MiPerfilView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_profile(self, user):
        try:
            return user.cliente_profile
        except ClienteProfile.DoesNotExist:
            return None

    def get(self, request):
        profile = self._get_profile(request.user)
        if not profile:
            return Response({'success': False, 'message': 'Perfil no encontrado.'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': ClienteProfileSerializer(profile).data})

    def patch(self, request):
        profile = self._get_profile(request.user)
        if not profile:
            return Response({'success': False, 'message': 'Perfil no encontrado.'},
                            status=status.HTTP_404_NOT_FOUND)
        serializer = ClienteProfileSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({'success': True, 'data': serializer.data})


# ── QR del cliente (imagen base64) ───────────────────────────────────────────

class MiQRView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.cliente_profile
        except ClienteProfile.DoesNotExist:
            return Response({'success': False, 'message': 'Perfil no encontrado.'},
                            status=status.HTTP_404_NOT_FOUND)

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(str(profile.qr_token))
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')

        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_b64 = base64.b64encode(buffer.read()).decode('utf-8')

        return Response({
            'success': True,
            'data': {
                'qr_token':   str(profile.qr_token),
                'qr_base64':  f'data:image/png;base64,{img_b64}',
            },
        })


# ── Historial de compras del cliente ─────────────────────────────────────────

class MisComprasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.cliente_profile
        except ClienteProfile.DoesNotExist:
            return Response({'success': False, 'data': []})

        from sales.models import Venta
        from sales.serializers import VentaSerializer

        ventas = Venta.objects.filter(cliente=profile).select_related(
            'sede', 'cajero'
        ).prefetch_related('items__producto')

        page      = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end   = start + page_size
        total = ventas.count()

        return Response({
            'success': True,
            'data': {
                'ventas':     VentaSerializer(ventas[start:end], many=True).data,
                'total':      total,
                'page':       page,
                'page_size':  page_size,
                'total_pages': (total + page_size - 1) // page_size,
            },
        })


# ── POS: buscar cliente por nombre/teléfono/email ────────────────────────────

class BuscarClienteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response({'success': True, 'data': []})

        profiles = ClienteProfile.objects.filter(
            Q(usuario__first_name__icontains=q) |
            Q(usuario__last_name__icontains=q)  |
            Q(usuario__email__icontains=q)       |
            Q(telefono__icontains=q)
        ).select_related('usuario')[:10]

        return Response({
            'success': True,
            'data': ClienteBusquedaSerializer(profiles, many=True).data,
        })


# ── POS: obtener cliente por QR token ────────────────────────────────────────

class ClientePorQRView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, token):
        try:
            profile = ClienteProfile.objects.select_related('usuario').get(qr_token=token)
        except (ClienteProfile.DoesNotExist, ValueError):
            return Response({'success': False, 'message': 'Cliente no encontrado.'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': ClienteBusquedaSerializer(profile).data})


# ─────────────────────────────────────────────────────────────────────────────
#  RECEPCIÓN — Panel de correos del cliente (ver / editar correo / reenviar)
# ─────────────────────────────────────────────────────────────────────────────

def _es_staff(user) -> bool:
    return bool(user and user.is_authenticated and getattr(user, 'role', None) != 'CUSTOMER')


def _logs_de_cliente(profile):
    """EmailLogs del cliente: vinculados por FK o por su correo actual."""
    email = profile.usuario.email or ''
    return EmailLog.objects.filter(Q(cliente=profile) | Q(destinatario__iexact=email))


def _reenviar_log(log, to_email) -> bool:
    """Reenvía un correo registrado (regenera el PDF del ticket si el contexto lo indica)."""
    from config.email_service import send_email, attachment_from_bytes
    attachments = None
    ctx = log.contexto or {}
    venta_id = ctx.get('venta_id')
    if venta_id:
        try:
            from sales.models import Venta
            from sales.pdf_service import generate_ticket_venta_pdf
            venta = Venta.objects.get(pk=venta_id)
            pdf = generate_ticket_venta_pdf(venta)
            attachments = [attachment_from_bytes(f'ticket_{venta.id}.pdf', pdf.read())]
        except Exception:
            attachments = None
    return send_email(
        to=to_email,
        subject=log.asunto or 'MotoQFox',
        html=log.html or '<p>(sin contenido)</p>',
        text=log.texto or None,
        attachments=attachments,
        tipo=log.tipo or 'OTRO',
        cliente=log.cliente,
        contexto=ctx,
    )


class RecepcionClientesView(APIView):
    """Lista/búsqueda de clientes con resumen de correos enviados."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        qs = ClienteProfile.objects.select_related('usuario')
        if q:
            qs = qs.filter(
                Q(usuario__first_name__icontains=q) |
                Q(usuario__last_name__icontains=q) |
                Q(usuario__email__icontains=q) |
                Q(telefono__icontains=q)
            )
        qs = qs.order_by('-created_at')[:30]
        data = []
        for p in qs:
            logs = _logs_de_cliente(p)
            total = logs.count()
            data.append({
                'id': p.id,
                'nombre': p.usuario.get_full_name(),
                'email': p.usuario.email or '',
                'telefono': p.telefono,
                'correos_total': total,
                'correos_enviados': logs.filter(enviado=True).count(),
                'sin_correos': total == 0,
            })
        return Response({'success': True, 'data': data})


class ClienteCorreosView(APIView):
    """Historial de correos enviados a un cliente."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            p = ClienteProfile.objects.select_related('usuario').get(pk=pk)
        except ClienteProfile.DoesNotExist:
            return Response({'success': False, 'message': 'Cliente no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        logs = _logs_de_cliente(p).order_by('-created_at')[:100]
        correos = [{
            'id': l.id,
            'asunto': l.asunto,
            'tipo': l.tipo,
            'tipo_display': l.get_tipo_display(),
            'enviado': l.enviado,
            'error': l.error,
            'destinatario': l.destinatario,
            'fecha': l.created_at.isoformat(),
        } for l in logs]
        return Response({'success': True, 'data': {
            'cliente': {
                'id': p.id,
                'nombre': p.usuario.get_full_name(),
                'email': p.usuario.email or '',
                'telefono': p.telefono,
            },
            'correos': correos,
        }})


class EditarCorreoClienteView(APIView):
    """Editar el correo del cliente (actualiza CustomUser.email)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not _es_staff(request.user):
            return Response({'success': False, 'message': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            p = ClienteProfile.objects.select_related('usuario').get(pk=pk)
        except ClienteProfile.DoesNotExist:
            return Response({'success': False, 'message': 'Cliente no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        nuevo = (request.data.get('email') or '').strip().lower()
        try:
            validate_email(nuevo)
        except ValidationError:
            return Response({'success': False, 'message': 'Correo inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        from users.models import CustomUser
        if CustomUser.objects.filter(email__iexact=nuevo).exclude(pk=p.usuario_id).exists():
            return Response({'success': False, 'message': 'Ese correo ya lo usa otro usuario.'}, status=status.HTTP_400_BAD_REQUEST)

        u = p.usuario
        u.email = nuevo
        u.save(update_fields=['email'])
        return Response({'success': True, 'message': 'Correo actualizado.', 'data': {'email': nuevo}})


class ReenviarCorreosView(APIView):
    """Reenvía al cliente todo lo enviado (o un correo específico con log_id)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not _es_staff(request.user):
            return Response({'success': False, 'message': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            p = ClienteProfile.objects.select_related('usuario').get(pk=pk)
        except ClienteProfile.DoesNotExist:
            return Response({'success': False, 'message': 'Cliente no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        email = (p.usuario.email or '').strip()
        if not email:
            return Response({'success': False, 'message': 'El cliente no tiene correo. Edítalo primero.'}, status=status.HTTP_400_BAD_REQUEST)

        log_id = request.data.get('log_id')
        base = _logs_de_cliente(p)
        logs = base.filter(pk=log_id) if log_id else base.order_by('created_at')

        reenviados = 0
        for log in logs:
            if _reenviar_log(log, email):
                reenviados += 1
        return Response({
            'success': True,
            'message': f'Se reenviaron {reenviados} correo(s) a {email}.',
            'data': {'reenviados': reenviados, 'email': email},
        })
