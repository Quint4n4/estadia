import React, { useEffect, useState, useCallback } from 'react';
import { customersService } from '../../api/customers.service';

interface ClienteRow {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  correos_total: number;
  correos_enviados: number;
  sin_correos: boolean;
}
interface CorreoRow {
  id: number;
  asunto: string;
  tipo: string;
  tipo_display: string;
  enviado: boolean;
  error: string;
  destinatario: string;
  fecha: string;
}
interface Detalle {
  cliente: { id: number; nombre: string; email: string; telefono: string };
  correos: CorreoRow[];
}

const fmtFecha = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

const RecepcionCorreosView: React.FC = () => {
  const [q, setQ] = useState('');
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [loadingDet, setLoadingDet] = useState(false);
  const [emailEdit, setEmailEdit] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const cargarLista = useCallback(async () => {
    setLoadingList(true);
    try {
      const r = await customersService.recepcionClientes(q);
      setClientes(r.data ?? []);
    } catch {
      setClientes([]);
    } finally {
      setLoadingList(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(cargarLista, 350);
    return () => clearTimeout(t);
  }, [cargarLista]);

  const abrirCliente = async (id: number) => {
    setLoadingDet(true);
    setMsg(null);
    try {
      const r = await customersService.clienteCorreos(id);
      setDetalle(r.data);
      setEmailEdit(r.data?.cliente?.email ?? '');
    } catch {
      setMsg({ ok: false, text: 'No se pudo cargar el cliente.' });
    } finally {
      setLoadingDet(false);
    }
  };

  const guardarEmail = async () => {
    if (!detalle) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await customersService.editarCorreoCliente(detalle.cliente.id, emailEdit.trim());
      if (r.success) {
        setMsg({ ok: true, text: 'Correo actualizado correctamente.' });
        setDetalle({ ...detalle, cliente: { ...detalle.cliente, email: r.data.email } });
        cargarLista();
      } else {
        setMsg({ ok: false, text: r.message ?? 'No se pudo actualizar.' });
      }
    } catch (e: any) {
      setMsg({ ok: false, text: e?.response?.data?.message ?? 'Error al actualizar el correo.' });
    } finally {
      setBusy(false);
    }
  };

  const reenviar = async (logId?: number) => {
    if (!detalle) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await customersService.reenviarCorreos(detalle.cliente.id, logId);
      setMsg({ ok: !!r.success, text: r.message ?? '' });
      if (r.success) await abrirCliente(detalle.cliente.id);
    } catch (e: any) {
      setMsg({ ok: false, text: e?.response?.data?.message ?? 'Error al reenviar.' });
    } finally {
      setBusy(false);
    }
  };

  const correoVacio = detalle && !detalle.cliente.email;

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', padding: 4 }}>
      {/* ── Lista de clientes ── */}
      <div style={{ flex: '1 1 320px', minWidth: 280, maxWidth: 420 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar cliente por nombre, correo o teléfono…"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
            fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12,
          }}
        />
        {loadingList && <p style={{ color: '#718096', fontSize: 13 }}>Buscando…</p>}
        {!loadingList && clientes.length === 0 && (
          <p style={{ color: '#718096', fontSize: 13 }}>No hay clientes que coincidan.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {clientes.map(c => (
            <button
              key={c.id}
              onClick={() => abrirCliente(c.id)}
              style={{
                textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${detalle?.cliente.id === c.id ? '#4c51bf' : '#e2e8f0'}`,
                background: detalle?.cliente.id === c.id ? '#f0f4ff' : '#fff',
              }}
            >
              <div style={{ fontWeight: 700, color: '#2d3748', fontSize: 14 }}>{c.nombre || '(sin nombre)'}</div>
              <div style={{ fontSize: 12, color: c.email ? '#4a5568' : '#e53e3e', marginTop: 2 }}>
                {c.email || '⚠️ Sin correo'}
              </div>
              <div style={{ fontSize: 11, marginTop: 4, color: '#718096' }}>
                {c.correos_total === 0
                  ? '📭 Nada enviado aún'
                  : `📨 ${c.correos_enviados}/${c.correos_total} enviados`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Detalle del cliente ── */}
      <div style={{ flex: '2 1 420px', minWidth: 320 }}>
        {!detalle && !loadingDet && (
          <div style={{
            padding: 40, textAlign: 'center', color: '#718096', fontSize: 14,
            border: '1px dashed #e2e8f0', borderRadius: 12,
          }}>
            Selecciona un cliente para ver y gestionar sus correos.
          </div>
        )}
        {loadingDet && <p style={{ color: '#718096', fontSize: 13 }}>Cargando…</p>}

        {detalle && !loadingDet && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, background: '#fff' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#2d3748' }}>{detalle.cliente.nombre || '(sin nombre)'}</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#718096' }}>
              Tel: {detalle.cliente.telefono || '—'}
            </p>

            {/* Editar correo */}
            <label style={{ fontSize: 12, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Correo del cliente
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <input
                type="email"
                value={emailEdit}
                onChange={e => setEmailEdit(e.target.value)}
                placeholder="correo@cliente.com"
                style={{
                  flex: '1 1 220px', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                  fontSize: 14, outline: 'none',
                }}
              />
              <button
                onClick={guardarEmail}
                disabled={busy || emailEdit.trim() === detalle.cliente.email}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none', cursor: busy ? 'wait' : 'pointer',
                  background: emailEdit.trim() === detalle.cliente.email ? '#cbd5e0' : '#4c51bf',
                  color: '#fff', fontWeight: 700, fontSize: 13,
                }}
              >
                Guardar
              </button>
            </div>

            {correoVacio && (
              <p style={{ fontSize: 12, color: '#c05621', marginTop: 8 }}>
                ⚠️ Este cliente no tiene correo: por eso no le llega nada. Captúralo y reenvía.
              </p>
            )}

            {msg && (
              <div style={{
                marginTop: 12, padding: '9px 12px', borderRadius: 8, fontSize: 13,
                background: msg.ok ? '#f0fff4' : '#fff5f5',
                border: `1px solid ${msg.ok ? '#9ae6b4' : '#fed7d7'}`,
                color: msg.ok ? '#276749' : '#c53030',
              }}>
                {msg.text}
              </div>
            )}

            {/* Historial de correos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 0 10px' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2d3748' }}>
                Correos enviados ({detalle.correos.length})
              </span>
              {detalle.correos.length > 0 && (
                <button
                  onClick={() => reenviar()}
                  disabled={busy || !detalle.cliente.email}
                  style={{
                    padding: '7px 14px', borderRadius: 8, border: '1px solid #4c51bf', cursor: busy ? 'wait' : 'pointer',
                    background: '#fff', color: '#4c51bf', fontWeight: 700, fontSize: 12,
                  }}
                >
                  ↻ Reenviar todo
                </button>
              )}
            </div>

            {detalle.correos.length === 0 && (
              <p style={{ fontSize: 13, color: '#718096' }}>
                Aún no se le ha enviado ningún correo (o el registro empezó después).
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detalle.correos.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  padding: '10px 12px', borderRadius: 8, border: '1px solid #edf2f7', background: '#f8fafc',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{c.tipo_display}</div>
                    <div style={{ fontSize: 12, color: '#718096', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.asunto}
                    </div>
                    <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>{fmtFecha(c.fecha)} · {c.destinatario}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                      background: c.enviado ? '#f0fff4' : '#fff5f5',
                      color: c.enviado ? '#276749' : '#c53030',
                    }}>
                      {c.enviado ? '✓ Enviado' : '✗ Falló'}
                    </span>
                    <button
                      onClick={() => reenviar(c.id)}
                      disabled={busy || !detalle.cliente.email}
                      title="Reenviar este correo"
                      style={{
                        padding: '5px 10px', borderRadius: 7, border: '1px solid #e2e8f0', cursor: busy ? 'wait' : 'pointer',
                        background: '#fff', color: '#4a5568', fontWeight: 600, fontSize: 12,
                      }}
                    >
                      ↻
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecepcionCorreosView;
