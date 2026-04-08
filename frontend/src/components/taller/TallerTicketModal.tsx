import React, { useEffect, useState } from 'react';
import { X, Printer } from 'lucide-react';
import { billingService } from '../../api/billing.service';
import { useAuth } from '../../contexts/AuthContext';
import type { ServicioMotoDetail } from '../../types/taller.types';
import type { ConfiguracionFiscal } from '../../types/billing.types';

interface Props {
  servicio: ServicioMotoDetail;
  onClose: () => void;
}

const fmt = (n: string | number | null | undefined) =>
  parseFloat(String(n ?? 0)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const METODO_LABEL: Record<string, string> = {
  EFECTIVO:      'Efectivo',
  TARJETA:       'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
};

// ── Print HTML ────────────────────────────────────────────────────────────────

function buildPrintHtml(servicio: ServicioMotoDetail, config: ConfiguracionFiscal | null): string {
  const ivaTasa   = config?.iva_tasa ?? 16;
  const total     = parseFloat(servicio.total);
  const sinIva    = total / (1 + ivaTasa / 100);
  const ivaMonto  = total - sinIva;
  const isEfect   = servicio.metodo_pago === 'EFECTIVO';
  const folio     = servicio.folio;

  const logoHtml = config?.logo_url
    ? `<div style="text-align:center;margin-bottom:10px">
         <img src="${config.logo_url}" alt="Logo" style="max-height:60px;max-width:140px;object-fit:contain" />
       </div>` : '';

  const rfcHtml   = config?.rfc       ? `<p style="margin:2px 0 0;font-size:10px;color:#718096">RFC: ${config.rfc}</p>` : '';
  const dirHtml   = config?.direccion ? `<p style="margin:4px 0 0;font-size:10px;color:#4a5568;line-height:1.4">${config.direccion}</p>` : '';
  const telHtml   = config?.telefono  ? `<p style="margin:2px 0 0;font-size:10px;color:#4a5568">Tel: ${config.telefono}</p>` : '';
  const emailHtml = config?.email     ? `<p style="margin:2px 0 0;font-size:10px;color:#4a5568">${config.email}</p>` : '';

  const itemsVisibles = servicio.items.filter(i => i.aprobado || i.tipo === 'MANO_OBRA');
  const itemsHtml = itemsVisibles.map(item => `
    <div style="margin-bottom:6px">
      <div style="font-size:11px;font-weight:600;word-break:break-word">
        ${item.descripcion}
        <span style="font-weight:400;color:#718096;font-size:10px"> (${item.tipo_display})</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px">
        <span style="flex:1"></span>
        <span style="width:30px;text-align:center">${item.cantidad}</span>
        <span style="width:70px;text-align:right">${fmt(item.precio_unitario)}</span>
        <span style="width:80px;text-align:right;font-weight:600">${fmt(item.subtotal)}</span>
      </div>
    </div>`).join('');

  const cambioHtml = isEfect && servicio.cambio
    ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px">
         <span style="color:#718096">Pagado:</span>
         <span>${fmt(servicio.monto_pagado)}</span>
       </div>
       <div style="display:flex;justify-content:space-between">
         <span style="color:#718096">Cambio:</span>
         <span>${fmt(servicio.cambio)}</span>
       </div>` : '';

  const leyenda = config?.leyenda_ticket ?? 'Gracias por su preferencia.';
  const nombre  = config?.nombre_comercial ?? servicio.sede_nombre;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket Taller ${folio} — ${nombre}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: monospace; font-size: 12px; background: #fff; width: 80mm; margin: 0 auto; padding: 12px 10px; color: #1a202c; }
    hr.dashed { border: none; border-top: 1px dashed #a0aec0; margin: 10px 0; }
    hr.solid  { border: none; border-top: 1px solid #e2e8f0; margin: 4px 0 6px; }
    @media print { body { margin: 0; padding: 8px 6px; } }
  </style>
</head>
<body>
  ${logoHtml}
  <div style="text-align:center;margin-bottom:14px">
    <p style="font-size:15px;font-weight:700;font-family:sans-serif">${nombre}</p>
    ${rfcHtml}${dirHtml}${telHtml}${emailHtml}
  </div>

  <hr class="dashed" />

  <div style="text-align:center;margin-bottom:8px">
    <p style="font-size:10px;font-weight:700;color:#718096;font-family:sans-serif;letter-spacing:.06em">ORDEN DE SERVICIO</p>
  </div>

  <div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between">
      <span style="color:#718096">Folio:</span>
      <span style="font-weight:700">${folio}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:2px">
      <span style="color:#718096">Fecha:</span>
      <span>${fmtDate(servicio.fecha_recepcion)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:2px">
      <span style="color:#718096">Cajero:</span>
      <span>${servicio.cajero_nombre}</span>
    </div>
    ${servicio.mecanico_nombre ? `
    <div style="display:flex;justify-content:space-between;margin-top:2px">
      <span style="color:#718096">Mecánico:</span>
      <span>${servicio.mecanico_nombre}</span>
    </div>` : ''}
  </div>

  <hr class="dashed" />

  <div style="margin-bottom:10px">
    <p style="font-size:10px;font-weight:700;color:#718096;font-family:sans-serif;margin-bottom:4px">VEHÍCULO</p>
    <p style="font-size:12px;font-weight:600">${servicio.moto.marca} ${servicio.moto.modelo} ${servicio.moto.anio}</p>
    ${servicio.moto.numero_serie ? `<p style="font-size:10px;color:#718096;margin-top:2px">N/S: ${servicio.moto.numero_serie}</p>` : ''}
    ${servicio.moto.placa ? `<p style="font-size:10px;color:#718096;margin-top:2px">Placa: ${servicio.moto.placa}</p>` : ''}
    <p style="font-size:11px;color:#4a5568;margin-top:4px;line-height:1.4">${servicio.descripcion_problema}</p>
  </div>

  <hr class="dashed" />

  <div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;color:#718096;margin-bottom:4px">
      <span style="flex:1">Concepto</span>
      <span style="width:30px;text-align:center">Qty</span>
      <span style="width:70px;text-align:right">Precio</span>
      <span style="width:80px;text-align:right">Importe</span>
    </div>
    <hr class="solid" />
    ${itemsHtml || '<p style="font-size:10px;color:#718096">Sin conceptos detallados</p>'}
  </div>

  <hr class="dashed" />

  <div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;margin-bottom:3px">
      <span style="color:#718096">Subtotal sin IVA:</span>
      <span>${fmt(sinIva)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:3px">
      <span style="color:#718096">IVA (${ivaTasa}%):</span>
      <span>${fmt(ivaMonto)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:6px;margin-top:4px">
      <span style="font-weight:700;font-size:14px">TOTAL:</span>
      <span style="font-weight:700;font-size:14px">${fmt(servicio.total)}</span>
    </div>
  </div>

  <div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;margin-bottom:3px">
      <span style="color:#718096">Forma de pago:</span>
      <span>${METODO_LABEL[servicio.metodo_pago ?? ''] ?? servicio.metodo_pago ?? '—'}</span>
    </div>
    ${cambioHtml}
  </div>

  <hr class="dashed" />

  <p style="text-align:center;font-size:10px;color:#718096;line-height:1.5;font-family:sans-serif">${leyenda}</p>

  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
  </script>
</body>
</html>`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const TallerTicketModal: React.FC<Props> = ({ servicio, onClose }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<ConfiguracionFiscal | null>(null);

  useEffect(() => {
    const sedeId = user?.sede?.id;
    if (!sedeId) return;
    billingService.getConfigFiscal(sedeId)
      .then(r => setConfig(r.data))
      .catch(() => {});
  }, [user?.sede?.id]);

  const handlePrint = () => {
    const html = buildPrintHtml(servicio, config);
    const win  = window.open('', '_blank', 'width=420,height=700,scrollbars=yes');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const ivaTasa  = config?.iva_tasa ?? 16;
  const total    = parseFloat(servicio.total);
  const sinIva   = total / (1 + ivaTasa / 100);
  const ivaMonto = total - sinIva;
  const isEfect  = servicio.metodo_pago === 'EFECTIVO';

  const itemsVisibles = servicio.items.filter(i => i.aprobado || i.tipo === 'MANO_OBRA');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,.15)',
          maxWidth: 420, width: '100%', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
        }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#2d3748' }}>
            Ticket Taller — {servicio.folio}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px' }}
            >
              <Printer size={14} />
              Imprimir / PDF
            </button>
            <button className="modal-close" onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Ticket preview */}
        <div style={{ padding: '20px 24px', fontFamily: 'monospace', fontSize: 12, maxHeight: '75vh', overflowY: 'auto' }}>

          {config?.logo_url && (
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <img src={config.logo_url} alt="Logo"
                style={{ maxHeight: 60, maxWidth: 140, objectFit: 'contain' }} />
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: 'sans-serif', color: '#1a202c' }}>
              {config?.nombre_comercial ?? servicio.sede_nombre}
            </p>
            {config?.rfc       && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#718096' }}>RFC: {config.rfc}</p>}
            {config?.direccion && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#4a5568', lineHeight: 1.4 }}>{config.direccion}</p>}
            {config?.telefono  && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#4a5568' }}>Tel: {config.telefono}</p>}
            {config?.email     && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#4a5568' }}>{config.email}</p>}
          </div>

          <div style={{ borderTop: '1px dashed #a0aec0', margin: '10px 0' }} />

          <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#718096', fontFamily: 'sans-serif', letterSpacing: '0.06em', marginBottom: 8 }}>
            ORDEN DE SERVICIO
          </p>

          {/* Folio / Fecha / Cajero */}
          <div style={{ marginBottom: 10 }}>
            {[
              { label: 'Folio:', value: servicio.folio },
              { label: 'Fecha:', value: fmtDate(servicio.fecha_recepcion) },
              { label: 'Cajero:', value: servicio.cajero_nombre },
              ...(servicio.mecanico_nombre ? [{ label: 'Mecánico:', value: servicio.mecanico_nombre }] : []),
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ color: '#718096' }}>{row.label}</span>
                <span style={{ textAlign: 'right', maxWidth: '65%' }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #a0aec0', margin: '10px 0' }} />

          {/* Moto */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#718096', fontFamily: 'sans-serif', marginBottom: 4 }}>VEHÍCULO</p>
            <p style={{ fontSize: 12, fontWeight: 600 }}>
              {servicio.moto.marca} {servicio.moto.modelo} {servicio.moto.anio}
            </p>
            {servicio.moto.numero_serie && (
              <p style={{ fontSize: 10, color: '#718096', marginTop: 2 }}>N/S: {servicio.moto.numero_serie}</p>
            )}
            {servicio.moto.placa && (
              <p style={{ fontSize: 10, color: '#718096', marginTop: 2 }}>Placa: {servicio.moto.placa}</p>
            )}
            <p style={{ fontSize: 11, color: '#4a5568', marginTop: 4, lineHeight: 1.4 }}>
              {servicio.descripcion_problema}
            </p>
          </div>

          <div style={{ borderTop: '1px dashed #a0aec0', margin: '10px 0' }} />

          {/* Items */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#718096', marginBottom: 4 }}>
              <span style={{ flex: 1 }}>Concepto</span>
              <span style={{ width: 30, textAlign: 'center' }}>Qty</span>
              <span style={{ width: 70, textAlign: 'right' }}>Precio</span>
              <span style={{ width: 80, textAlign: 'right' }}>Importe</span>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', marginBottom: 6 }} />
            {itemsVisibles.length > 0 ? itemsVisibles.map(item => (
              <div key={item.id} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, wordBreak: 'break-word' }}>
                  {item.descripcion}
                  <span style={{ fontWeight: 400, color: '#718096', fontSize: 10 }}> ({item.tipo_display})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 2 }}>
                  <span style={{ flex: 1 }} />
                  <span style={{ width: 30, textAlign: 'center' }}>{item.cantidad}</span>
                  <span style={{ width: 70, textAlign: 'right' }}>{fmt(item.precio_unitario)}</span>
                  <span style={{ width: 80, textAlign: 'right', fontWeight: 600 }}>{fmt(item.subtotal)}</span>
                </div>
              </div>
            )) : (
              <p style={{ fontSize: 10, color: '#718096' }}>Sin conceptos detallados</p>
            )}
          </div>

          <div style={{ borderTop: '1px dashed #a0aec0', margin: '10px 0' }} />

          {/* Totales con IVA */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#718096' }}>Subtotal sin IVA:</span>
              <span>{fmt(sinIva)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#718096' }}>IVA ({ivaTasa}%):</span>
              <span>{fmt(ivaMonto)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>TOTAL:</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{fmt(servicio.total)}</span>
            </div>
          </div>

          {/* Pago */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#718096' }}>Forma de pago:</span>
              <span>{METODO_LABEL[servicio.metodo_pago ?? ''] ?? servicio.metodo_pago ?? '—'}</span>
            </div>
            {isEfect && servicio.monto_pagado && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: '#718096' }}>Pagado:</span>
                  <span>{fmt(servicio.monto_pagado)}</span>
                </div>
                {servicio.cambio && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#718096' }}>Cambio:</span>
                    <span>{fmt(servicio.cambio)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ borderTop: '1px dashed #a0aec0', margin: '10px 0' }} />

          <p style={{ margin: 0, textAlign: 'center', fontSize: 10, color: '#718096', lineHeight: 1.5, fontFamily: 'sans-serif' }}>
            {config?.leyenda_ticket ?? 'Gracias por su preferencia.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TallerTicketModal;
