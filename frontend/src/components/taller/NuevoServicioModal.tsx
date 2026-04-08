import React, { useState, useEffect, useRef } from 'react';
import {
  Bike, Wrench, CreditCard, AlertCircle, Loader2,
  Search, User, UserPlus, ClipboardList, Camera, CheckSquare, X, ImageIcon,
} from 'lucide-react';
import { tallerService } from '../../api/taller.service';
import { inventoryService } from '../../api/inventory.service';
import { customersService } from '../../api/customers.service';
import { catalogoServiciosService } from '../../api/catalogo-servicios.service';
import type { ServicioCreatePayload, MetodoPago, MotoCliente, ServicioItemInput } from '../../types/taller.types';
import type { ClienteBusqueda } from '../../types/customers.types';
import type { CatalogoServicioList } from '../../types/catalogo-servicios.types';
import type { Producto } from '../../types/inventory.types';
import { MOTOS_MEXICO } from '../../constants/motosCatalog';
import { useTallerOffline } from '../../hooks/useTallerOffline';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { db } from '../../db/localDB';

type Step = 'BUSCAR' | 'SELECCIONAR_MOTO' | 'NUEVA_MOTO' | 'REGISTRAR_CLIENTE' | 'SERVICIO';

interface RefaccionItem {
  producto: Producto;
  cantidad: number;
  precio_unitario: string;
}

interface Props {
  sedeId: number;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Checklist de recepción predefinido ───────────────────────────────────── */
const CHECKLIST_ITEMS = [
  'Casco incluido',
  'Documentos (tarjeta de circulación)',
  'Llave de repuesto',
  'Accesorios extras (alforjas, GPS…)',
  'Kilometraje registrado',
  'Gasolina en tanque',
  'Daños previos documentados',
  'Espejos presentes',
];

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO',      label: 'Efectivo' },
  { value: 'TARJETA',       label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

/* ── Estilos reutilizables ────────────────────────────────────────────────── */
const sectionCard: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '18px 20px',
  marginBottom: 16,
  background: '#fff',
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: '1px solid #f0f4f8',
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
  color: '#2d3748',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const iconCircle = (bg: string): React.CSSProperties => ({
  width: 30,
  height: 30,
  borderRadius: '50%',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
};

const footerRow: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'flex-end',
};

/* ── Componente ───────────────────────────────────────────────────────────── */
const NuevoServicioModal: React.FC<Props> = ({ sedeId, onClose, onCreated }) => {
  const { crearServicio } = useTallerOffline();
  const { isOffline } = useNetworkStatus();

  const [step, setStep] = useState<Step>('BUSCAR');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Estado: búsqueda de cliente ── */
  const [telefono,           setTelefono]           = useState('');
  const [buscando,           setBuscando]           = useState(false);
  const [clienteEncontrado,  setClienteEncontrado]  = useState<ClienteBusqueda | null>(null);
  const [clienteNoEncontrado,setClienteNoEncontrado]= useState(false);

  /* ── Estado: motos del cliente ── */
  const [motosCliente,      setMotosCliente]      = useState<MotoCliente[]>([]);
  const [cargandoMotos,     setCargandoMotos]     = useState(false);
  const [motoSeleccionadaId,setMotoSeleccionadaId]= useState<number | null>(null);

  /* ── Estado: nueva moto ── */
  const [marca,        setMarca]        = useState('');
  const [marcaQuery,   setMarcaQuery]   = useState('');
  const [marcaDropOpen,setMarcaDropOpen]= useState(false);
  const [modelo,       setModelo]       = useState('');
  const [modeloOtro,   setModeloOtro]   = useState('');
  const [anio,         setAnio]         = useState(new Date().getFullYear().toString());
  const [numeroSerie,  setNumeroSerie]  = useState('');
  const [placa,        setPlaca]        = useState('');
  const [color,        setColor]        = useState('');

  /* ── Estado: registro de cliente ── */
  const [regNombre,          setRegNombre]          = useState('');
  const [regApellido,        setRegApellido]        = useState('');
  const [regEmail,           setRegEmail]           = useState('');
  const [registrando,        setRegistrando]        = useState(false);
  const [clienteRegistradoId,setClienteRegistradoId]= useState<number | null>(null);

  /* ── Estado: tipo de servicio del catálogo ── */
  const [catalogoServicios,   setCatalogoServicios]   = useState<CatalogoServicioList[]>([]);
  const [loadingCatalogo,     setLoadingCatalogo]     = useState(false);
  const [servicioSeleccionado,setServicioSeleccionado]= useState<CatalogoServicioList | null>(null);

  /* ── Estado: datos del servicio ── */
  const [descripcion,       setDescripcion]       = useState('');
  const [manoDeObra,        setManoDeObra]        = useState('0.00');
  const [precioDelCatalogo, setPrecioDelCatalogo] = useState(false);
  const [fechaEstimada,     setFechaEstimada]     = useState('');
  const [notasInternas,     setNotasInternas]     = useState('');
  const [pagarAhora,        setPagarAhora]        = useState(false);
  const [metodo,            setMetodo]            = useState<MetodoPago>('EFECTIVO');
  const [montoPagado,       setMontoPagado]       = useState('');
  const [esReparacion,      setEsReparacion]      = useState(false);

  /* ── Estado: checklist e imágenes ── */
  const [checklist,    setChecklist]    = useState<string[]>([]);
  const [imagenes,     setImagenes]     = useState<File[]>([]);
  const [previews,     setPreviews]     = useState<string[]>([]);
  const [subiendo,     setSubiendo]     = useState(false);

  /* ── Estado: refacciones ── */
  const [refacciones,        setRefacciones]        = useState<RefaccionItem[]>([]);
  const [busqRef,            setBusqRef]            = useState('');
  const [resultadosRef,      setResultadosRef]      = useState<Producto[]>([]);
  const [buscandoRef,        setBuscandoRef]        = useState(false);
  const debounceRefRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  /* ID final del cliente (encontrado o recién registrado) */
  const clienteId = clienteEncontrado?.id ?? clienteRegistradoId ?? null;

  /* ── Cargar catálogo de servicios al entrar al paso SERVICIO ── */
  useEffect(() => {
    if (step !== 'SERVICIO' || catalogoServicios.length > 0) return;
    setLoadingCatalogo(true);
    catalogoServiciosService.getServicios({ activo: true })
      .then((res: any) => setCatalogoServicios(res?.data?.servicios ?? []))
      .catch(() => {})
      .finally(() => setLoadingCatalogo(false));
  }, [step]);

  /* ── Auto-rellenar monto cuando el método no es efectivo ── */
  useEffect(() => {
    if (!pagarAhora) return;
    if (metodo === 'TARJETA' || metodo === 'TRANSFERENCIA') {
      const totalRef = refacciones.reduce(
        (sum, r) => sum + (parseFloat(r.precio_unitario) || 0) * r.cantidad, 0
      );
      const total = (parseFloat(manoDeObra) || 0) + totalRef;
      setMontoPagado(total.toFixed(2));
    }
    // Para EFECTIVO dejamos que el cajero ingrese el monto manualmente
  }, [metodo, pagarAhora]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Navegar entre pasos ── */
  const goTo = (s: Step) => { setError(''); setStep(s); };

  /* ── Buscar cliente por teléfono ── */
  const handleBuscar = async () => {
    if (!telefono.trim()) return;
    if (telefono.length !== 10) {
      setError('El número de teléfono debe tener exactamente 10 dígitos.');
      return;
    }
    setError('');
    setBuscando(true);
    setClienteEncontrado(null);
    setClienteNoEncontrado(false);
    try {
      const res = await customersService.buscar(telefono.trim());
      if (res.data.length > 0) {
        const cliente = res.data[0];
        setClienteEncontrado(cliente);
        setCargandoMotos(true);
        try {
          const motosRes = await tallerService.listMotos({ cliente_id: cliente.id });
          const motos = motosRes.data ?? [];
          setMotosCliente(motos);
          // Cachear para uso offline
          const ahora = new Date().toISOString();
          await db.clientes_taller.put({
            id: cliente.id, nombre: cliente.nombre,
            email: cliente.email, telefono: cliente.telefono, cachedAt: ahora,
          });
          if (motos.length > 0) {
            await db.motos_cliente.bulkPut(motos.map(m => ({
              id: m.id, clienteId: cliente.id,
              marca: m.marca, modelo: m.modelo, anio: Number(m.anio),
              numero_serie: m.numero_serie, placa: m.placa ?? '', color: m.color ?? '',
              clienteNombre: cliente.nombre, cachedAt: ahora,
            })));
          }
        } finally {
          setCargandoMotos(false);
        }
      } else {
        setClienteNoEncontrado(true);
      }
    } catch {
      // Sin red: buscar en cache local
      const clienteLocal = await db.clientes_taller
        .where('telefono').equals(telefono.trim()).first();
      if (clienteLocal) {
        setClienteEncontrado({
          id: clienteLocal.id, nombre: clienteLocal.nombre,
          email: clienteLocal.email, telefono: clienteLocal.telefono,
          foto_url: '', puntos: 0, qr_token: '',
        });
        const motosLocales = await db.motos_cliente
          .where('clienteId').equals(clienteLocal.id).toArray();
        setMotosCliente(motosLocales as unknown as MotoCliente[]);
      } else {
        setError('Sin conexión. El cliente no está en el cache local. Búscalo cuando haya internet.');
      }
    } finally {
      setBuscando(false);
    }
  };

  /* ── Registrar nuevo cliente ── */
  const handleRegistrarCliente = async () => {
    if (!regNombre.trim() || !regEmail.trim()) {
      setError('Nombre y correo electrónico son requeridos.');
      return;
    }
    if (telefono && telefono.length !== 10) {
      setError('El número de teléfono debe tener exactamente 10 dígitos.');
      return;
    }
    setError('');
    setRegistrando(true);
    try {
      const res = await customersService.registrar({
        first_name: regNombre.trim(),
        last_name:  regApellido.trim(),
        email:      regEmail.trim(),
        telefono:   telefono.trim(),
        password:   `MotoQFox@${Math.random().toString(36).slice(2, 10)}`,
        sede_id:    sedeId,
      });
      setClienteRegistradoId(res.data.profile.id);
      goTo('NUEVA_MOTO');
    } catch (err: any) {
      const errData = err?.response?.data?.errors;
      if (errData?.email) {
        setError(`Correo: ${errData.email.join(', ')}`);
      } else {
        setError(err?.response?.data?.message ?? 'Error al registrar el cliente.');
      }
    } finally {
      setRegistrando(false);
    }
  };

  /* ── Toggle ítem del checklist ── */
  const toggleChecklist = (item: string) => {
    setChecklist(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  /* ── Agregar imágenes desde el input ── */
  const handleAgregarImagenes = (files: FileList | null) => {
    if (!files) return;
    const nuevas = Array.from(files).filter(f => f.type.startsWith('image/'));
    const total = imagenes.length + nuevas.length;
    const aAgregar = total > 8 ? nuevas.slice(0, 8 - imagenes.length) : nuevas;
    if (aAgregar.length === 0) return;
    setImagenes(prev => [...prev, ...aAgregar]);
    aAgregar.forEach(f => {
      const url = URL.createObjectURL(f);
      setPreviews(prev => [...prev, url]);
    });
  };

  /* ── Quitar imagen ── */
  const handleQuitarImagen = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setImagenes(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  /* ── Buscar producto para refacción ── */
  const handleBusqRef = (valor: string) => {
    setBusqRef(valor);
    if (debounceRefRef.current) clearTimeout(debounceRefRef.current);
    if (!valor.trim()) { setResultadosRef([]); return; }
    debounceRefRef.current = setTimeout(async () => {
      setBuscandoRef(true);
      try {
        const res = await inventoryService.listProducts({ search: valor, sede_id: sedeId, page_size: 8 });
        setResultadosRef(res.data?.products ?? []);
      } catch { setResultadosRef([]); }
      finally { setBuscandoRef(false); }
    }, 300);
  };

  const agregarRefaccion = (p: Producto) => {
    const yaExiste = refacciones.find(r => r.producto.id === p.id);
    if (!yaExiste) {
      setRefacciones(prev => [...prev, {
        producto: p,
        cantidad: 1,
        precio_unitario: String(p.price ?? '0.00'),
      }]);
    }
    setBusqRef('');
    setResultadosRef([]);
  };

  const quitarRefaccion = (id: number) => {
    setRefacciones(prev => prev.filter(r => r.producto.id !== id));
  };

  const cambiarCantidadRef = (id: number, val: string) => {
    setRefacciones(prev => prev.map(r =>
      r.producto.id === id ? { ...r, cantidad: Math.max(1, Number(val) || 1) } : r
    ));
  };

  const cambiarPrecioRef = (id: number, val: string) => {
    setRefacciones(prev => prev.map(r =>
      r.producto.id === id ? { ...r, precio_unitario: val } : r
    ));
  };

  /* ── Crear el servicio ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado) {
      setError('Selecciona el tipo de servicio.');
      return;
    }
    if (esReparacion && !descripcion.trim()) {
      setError('La descripción del problema es requerida para reparaciones.');
      return;
    }
    if (pagarAhora) {
      const monto = parseFloat(montoPagado);
      if (!montoPagado || isNaN(monto) || monto <= 0) {
        setError('Ingresa el monto recibido del cliente.');
        return;
      }
      if (monto < totalGeneral) {
        setError(`El monto recibido ($${monto.toFixed(2)}) es menor al total ($${totalGeneral.toFixed(2)}).`);
        return;
      }
    }
    setError('');
    setLoading(true);

    const descripcionFinal = esReparacion
      ? descripcion.trim()
      : servicioSeleccionado!.nombre;

    const payload: ServicioCreatePayload = {
      sede:                   sedeId,
      cliente:                clienteId ?? undefined,
      descripcion:            descripcionFinal,
      es_reparacion:          esReparacion,
      mano_de_obra:           manoDeObra,
      checklist_recepcion:    checklist,
      fecha_entrega_estimada: fechaEstimada || null,
      notas_internas:         notasInternas.trim(),
      pago_status:            pagarAhora ? 'PAGADO' : 'PENDIENTE_PAGO',
      metodo_pago:            pagarAhora ? metodo : undefined,
      monto_pagado:           pagarAhora ? montoPagado : undefined,
      items: refacciones.map(r => ({
        tipo: 'REFACCION' as const,
        producto: r.producto.id,
        descripcion: r.producto.name,
        cantidad: r.cantidad,
        precio_unitario: r.precio_unitario,
      } satisfies ServicioItemInput)),
    };

    if (motoSeleccionadaId) {
      payload.moto = motoSeleccionadaId;
    } else {
      const modeloFinal = modelo === 'Otro modelo...' ? modeloOtro.trim() : modelo.trim();
      payload.moto_nueva = {
        marca:        marca.trim(),
        modelo:       modeloFinal,
        anio:         Number(anio),
        numero_serie: numeroSerie.trim(),
        placa:        placa.trim() || undefined,
        color:        color.trim() || undefined,
      };
    }

    try {
      const motoDisplay = motoSeleccionadaId
        ? motosCliente.find(m => m.id === motoSeleccionadaId)
            ? `${motosCliente.find(m => m.id === motoSeleccionadaId)!.marca} ${motosCliente.find(m => m.id === motoSeleccionadaId)!.modelo}`
            : undefined
        : marca && modelo ? `${marca} ${modelo}` : undefined;

      const res = await crearServicio(
        payload, sedeId,
        clienteEncontrado?.nombre,
        motoDisplay,
      );

      if ((res as any).offline) {
        // Servicio guardado offline — imágenes no se pueden subir sin conexión
        onCreated();
        onClose();
        return;
      }

      // Subir imágenes si hay (solo online)
      if (imagenes.length > 0 && res?.data?.id) {
        setSubiendo(true);
        try {
          await tallerService.subirImagenes(res.data.id, imagenes);
        } catch {
          // Las imágenes fallaron pero el servicio ya fue creado; no bloqueamos
        } finally {
          setSubiendo(false);
        }
      }
      onCreated();
      onClose();
    } catch (err: any) {
      const errData = err?.response?.data;
      // Extraer mensaje legible: prioridad message > errors.moto > errors.* > genérico
      let msg = 'Error al crear el servicio.';
      if (errData?.message) {
        msg = errData.message;
      } else if (errData?.errors) {
        const errs = errData.errors;
        // Recorrer los campos y unir todos los mensajes en texto plano
        const partes: string[] = [];
        for (const campo of Object.keys(errs)) {
          const val = errs[campo];
          if (typeof val === 'string') partes.push(val);
          else if (Array.isArray(val)) partes.push(val.join(', '));
        }
        if (partes.length) msg = partes.join(' | ');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Indicador de progreso (3 segmentos: Buscar / Moto / Servicio) ── */
  const progressIdx =
    step === 'BUSCAR'            ? 0 :
    step === 'REGISTRAR_CLIENTE' ? 1 :
    step === 'SELECCIONAR_MOTO'  ? 1 :
    step === 'NUEVA_MOTO'        ? 1 : 2;

  const stepSubtitle: Record<Step, string> = {
    BUSCAR:            'Buscar cliente',
    SELECCIONAR_MOTO:  'Seleccionar moto',
    NUEVA_MOTO:        'Datos de la moto',
    REGISTRAR_CLIENTE: 'Nuevo cliente',
    SERVICIO:          'Detalles del servicio',
  };

  /* ── Moto seleccionada (para mostrar resumen) ── */
  const motoSel = motosCliente.find(m => m.id === motoSeleccionadaId);

  const totalRefacciones = refacciones.reduce(
    (sum, r) => sum + (parseFloat(r.precio_unitario) || 0) * r.cantidad, 0
  );
  const totalGeneral = (parseFloat(manoDeObra) || 0) + totalRefacciones;
  const montoPagadoNum = parseFloat(montoPagado) || 0;
  const cambioCalculado = pagarAhora && metodo === 'EFECTIVO' && montoPagadoNum > 0
    ? montoPagadoNum - totalGeneral
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', padding: 0 }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '10px 10px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wrench size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>
                  Nuevo Servicio de Taller
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, marginTop: 2 }}>
                  {stepSubtitle[step]}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                color: '#fff', width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, lineHeight: 1,
              }}
            >✕</button>
          </div>

          {/* Barra de progreso: 3 pasos numerados */}
          {(() => {
            const steps = ['Cliente', 'Moto', 'Servicio'];
            return (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 18, gap: 0 }}>
                {steps.map((label, i) => {
                  const done    = i < progressIdx;
                  const active  = i === progressIdx;
                  return (
                    <React.Fragment key={i}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 12,
                          background: done ? '#68d391' : active ? '#fff' : 'rgba(255,255,255,0.18)',
                          color:      done ? '#276749' : active ? '#1a1a2e' : 'rgba(255,255,255,0.5)',
                          transition: 'all 0.2s',
                          border:     active ? '2px solid #fff' : 'none',
                        }}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: active ? 700 : 400,
                          color: done ? '#9ae6b4' : active ? '#fff' : 'rgba(255,255,255,0.45)',
                          letterSpacing: '0.03em',
                        }}>
                          {label}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div style={{
                          flex: 1, height: 2, marginBottom: 16,
                          background: i < progressIdx ? '#68d391' : 'rgba(255,255,255,0.2)',
                          transition: 'background 0.2s',
                        }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ── Contenido ── */}
        <div style={{ padding: '20px 24px 24px' }}>

          {/* Error global */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#fff5f5', border: '1px solid #fed7d7',
              borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              fontSize: 13, color: '#c53030',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* ════════════════════ STEP: BUSCAR ════════════════════ */}
          {step === 'BUSCAR' && (
            <>
              <div style={sectionCard}>
                <div style={sectionHeader}>
                  <div style={iconCircle('#ebf8ff')}>
                    <Search size={15} color="#3182ce" />
                  </div>
                  <span style={sectionTitle}>Buscar cliente por teléfono</span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      className="form-input"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={telefono}
                      onChange={e => {
                        const soloDigitos = e.target.value.replace(/\D/g, '');
                        setTelefono(soloDigitos);
                        setClienteEncontrado(null);
                        setClienteNoEncontrado(false);
                      }}
                      placeholder="Ej: 5512345678"
                      style={{
                        width: '100%',
                        borderColor: telefono.length > 0 && telefono.length !== 10 ? '#fc8181' : undefined,
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                    />
                    {telefono.length > 0 && (
                      <span style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 11, fontWeight: 600, pointerEvents: 'none',
                        color: telefono.length === 10 ? '#38a169' : '#e53e3e',
                      }}>
                        {telefono.length}/10
                      </span>
                    )}
                  </div>
                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={handleBuscar}
                    disabled={buscando || telefono.length !== 10}
                    style={{ minWidth: 90, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {buscando ? <Loader2 size={14} className="icon-spin" /> : <Search size={14} />}
                    Buscar
                  </button>
                </div>

                {/* Cliente encontrado */}
                {clienteEncontrado && (
                  <div style={{
                    marginTop: 14, padding: '14px 16px',
                    background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ ...iconCircle('#c6f6d5'), width: 42, height: 42 }}>
                        <User size={18} color="#276749" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#276749' }}>
                          {clienteEncontrado.nombre}
                        </div>
                        <div style={{ fontSize: 12, color: '#48bb78', marginTop: 2 }}>
                          {clienteEncontrado.telefono} · {clienteEncontrado.email}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 12, color: '#276749',
                        background: '#c6f6d5', padding: '3px 10px', borderRadius: 20,
                        fontWeight: 600,
                      }}>
                        {clienteEncontrado.puntos} pts
                      </div>
                    </div>
                    {cargandoMotos ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: '#718096', fontSize: 12 }}>
                        <Loader2 size={13} className="icon-spin" /> Cargando motos…
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, fontSize: 12, color: '#4a5568' }}>
                        {motosCliente.length > 0
                          ? `${motosCliente.length} moto${motosCliente.length > 1 ? 's' : ''} registrada${motosCliente.length > 1 ? 's' : ''}`
                          : 'Sin motos registradas aún'}
                      </div>
                    )}
                  </div>
                )}

                {/* No encontrado */}
                {clienteNoEncontrado && (
                  <div style={{
                    marginTop: 14, padding: '14px 16px',
                    background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 10,
                  }}>
                    <div style={{ fontWeight: 600, color: '#c05621', fontSize: 14, marginBottom: 4 }}>
                      Cliente no encontrado
                    </div>
                    <div style={{ fontSize: 13, color: '#718096' }}>
                      No existe un cliente con el número <strong>{telefono}</strong>. Puedes registrarlo a continuación.
                    </div>
                  </div>
                )}
              </div>

              <div style={footerRow}>
                <button type="button" className="btn btn--secondary" onClick={onClose}>
                  Cancelar
                </button>
                {clienteNoEncontrado && (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => { setRegNombre(''); setRegApellido(''); setRegEmail(''); goTo('REGISTRAR_CLIENTE'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <UserPlus size={14} /> Registrar cliente
                  </button>
                )}
                {clienteEncontrado && !cargandoMotos && (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => goTo('SELECCIONAR_MOTO')}
                  >
                    Continuar
                  </button>
                )}
              </div>
            </>
          )}

          {/* ════════════════════ STEP: SELECCIONAR_MOTO ════════════════════ */}
          {step === 'SELECCIONAR_MOTO' && clienteEncontrado && (
            <>
              {/* Mini badge del cliente */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f0fff4', border: '1px solid #9ae6b4',
                borderRadius: 8, padding: '8px 14px', marginBottom: 16,
                fontSize: 13,
              }}>
                <User size={14} color="#276749" />
                <span style={{ fontWeight: 700, color: '#276749' }}>{clienteEncontrado.nombre}</span>
                <span style={{ color: '#48bb78' }}>· {clienteEncontrado.telefono}</span>
              </div>

              <div style={sectionCard}>
                <div style={sectionHeader}>
                  <div style={iconCircle('#ebf8ff')}>
                    <Bike size={15} color="#3182ce" />
                  </div>
                  <span style={sectionTitle}>Seleccionar moto</span>
                </div>

                {motosCliente.length === 0 ? (
                  <p style={{ color: '#718096', fontSize: 13, textAlign: 'center', padding: '8px 0 4px' }}>
                    Este cliente no tiene motos registradas.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {motosCliente.map(moto => (
                      <button
                        key={moto.id}
                        type="button"
                        onClick={() => setMotoSeleccionadaId(moto.id)}
                        style={{
                          textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                          border: motoSeleccionadaId === moto.id ? '2px solid #3182ce' : '1px solid #e2e8f0',
                          background: motoSeleccionadaId === moto.id ? '#ebf8ff' : '#f7fafc',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#2d3748' }}>
                          {moto.marca} {moto.modelo} · {moto.anio}
                        </div>
                        <div style={{ fontSize: 12, color: '#718096', marginTop: 3 }}>
                          {[moto.placa && `Placa: ${moto.placa}`, moto.color && `Color: ${moto.color}`].filter(Boolean).join(' · ')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMotoSeleccionadaId(null);
                    setMarca(''); setMarcaQuery(''); setModelo(''); setModeloOtro(''); setAnio(new Date().getFullYear().toString());
                    setNumeroSerie(''); setPlaca(''); setColor('');
                    goTo('NUEVA_MOTO');
                  }}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 8, cursor: 'pointer',
                    border: '1px dashed #3182ce', background: 'transparent',
                    color: '#3182ce', fontWeight: 600, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Bike size={14} /> Agregar moto nueva
                </button>
              </div>

              <div style={footerRow}>
                <button type="button" className="btn btn--secondary" onClick={() => goTo('BUSCAR')}>Atrás</button>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={!motoSeleccionadaId}
                  onClick={() => goTo('SERVICIO')}
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* ════════════════════ STEP: REGISTRAR_CLIENTE ════════════════════ */}
          {step === 'REGISTRAR_CLIENTE' && (
            <>
              <div style={sectionCard}>
                <div style={sectionHeader}>
                  <div style={iconCircle('#faf5ff')}>
                    <UserPlus size={15} color="#805ad5" />
                  </div>
                  <span style={sectionTitle}>Registrar nuevo cliente</span>
                </div>

                <div style={grid2}>
                  <div>
                    <label className="form-label">Nombre *</label>
                    <input
                      className="form-input"
                      value={regNombre}
                      onChange={e => setRegNombre(e.target.value)}
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label className="form-label">Apellido</label>
                    <input
                      className="form-input"
                      value={regApellido}
                      onChange={e => setRegApellido(e.target.value)}
                      placeholder="Pérez"
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Correo electrónico *</label>
                    <input
                      className="form-input"
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="cliente@correo.com"
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Teléfono</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={telefono}
                        onChange={e => setTelefono(e.target.value.replace(/\D/g, ''))}
                        placeholder="5512345678"
                        style={{
                          width: '100%',
                          borderColor: telefono.length > 0 && telefono.length !== 10 ? '#fc8181' : undefined,
                        }}
                      />
                      {telefono.length > 0 && (
                        <span style={{
                          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                          fontSize: 11, fontWeight: 600, pointerEvents: 'none',
                          color: telefono.length === 10 ? '#38a169' : '#e53e3e',
                        }}>
                          {telefono.length}/10
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={footerRow}>
                <button type="button" className="btn btn--secondary" onClick={() => goTo('BUSCAR')}>Atrás</button>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={registrando || !regNombre.trim() || !regEmail.trim()}
                  onClick={handleRegistrarCliente}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {registrando
                    ? <><Loader2 size={14} className="icon-spin" /> Registrando…</>
                    : 'Registrar y continuar'}
                </button>
              </div>
            </>
          )}

          {/* ════════════════════ STEP: NUEVA_MOTO ════════════════════ */}
          {step === 'NUEVA_MOTO' && (
            <>
              <div style={sectionCard}>
                <div style={sectionHeader}>
                  <div style={iconCircle('#ebf8ff')}>
                    <Bike size={15} color="#3182ce" />
                  </div>
                  <span style={sectionTitle}>Datos de la moto</span>
                </div>

                <div style={grid2}>
                  <div>
                    <label className="form-label">Marca *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        value={marcaQuery}
                        onChange={e => {
                          setMarcaQuery(e.target.value);
                          setMarca('');
                          setModelo('');
                          setModeloOtro('');
                          setMarcaDropOpen(true);
                        }}
                        onFocus={() => setMarcaDropOpen(true)}
                        onBlur={() => setTimeout(() => setMarcaDropOpen(false), 150)}
                        placeholder="Escribe la marca…"
                        autoComplete="off"
                      />
                      {marcaDropOpen && marcaQuery.trim().length > 0 && (() => {
                        const filtradas = MOTOS_MEXICO.filter(m =>
                          m.marca.toLowerCase().includes(marcaQuery.toLowerCase())
                        );
                        return filtradas.length > 0 ? (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: '#fff', border: '1px solid #e2e8f0',
                            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            zIndex: 200, maxHeight: 220, overflowY: 'auto',
                            marginTop: 2,
                          }}>
                            {filtradas.map(m => (
                              <div
                                key={m.marca}
                                onMouseDown={() => {
                                  setMarca(m.marca);
                                  setMarcaQuery(m.marca);
                                  setModelo('');
                                  setModeloOtro('');
                                  setMarcaDropOpen(false);
                                }}
                                style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 14, color: '#2d3748', borderBottom: '1px solid #f7fafc' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#ebf8ff')}
                                onMouseLeave={e => (e.currentTarget.style.background = '')}
                              >
                                {m.marca}
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Modelo *</label>
                    <select
                      className="form-input"
                      value={modelo}
                      onChange={e => {
                        setModelo(e.target.value);
                        if (e.target.value !== 'Otro modelo...') setModeloOtro('');
                      }}
                      disabled={!marca}
                    >
                      <option value="">
                        {marca ? 'Selecciona un modelo' : 'Selecciona una marca primero'}
                      </option>
                      {(MOTOS_MEXICO.find(m => m.marca === marca)?.modelos ?? []).map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                      {marca && <option value="Otro modelo...">Otro modelo...</option>}
                    </select>
                    {modelo === 'Otro modelo...' && (
                      <input
                        className="form-input"
                        style={{ marginTop: 8 }}
                        value={modeloOtro}
                        onChange={e => setModeloOtro(e.target.value)}
                        placeholder="Escribe el modelo…"
                        autoFocus
                      />
                    )}
                  </div>
                  <div>
                    <label className="form-label">Año *</label>
                    <input
                      className="form-input"
                      type="number"
                      inputMode="numeric"
                      value={anio}
                      onChange={e => setAnio(e.target.value)}
                      onKeyDown={e => ['e','E','+','-','.'].includes(e.key) && e.preventDefault()}
                      min={1990}
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Número de serie *</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: numeroSerie.length >= 14 ? '#38a169' : '#a0aec0',
                      }}>
                        {numeroSerie.length}/17
                      </span>
                    </label>
                    <input
                      className="form-input"
                      value={numeroSerie}
                      maxLength={17}
                      onChange={e => setNumeroSerie(e.target.value.toUpperCase())}
                      placeholder="Ej: MD2B3A30XRM123456"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Placa <span style={{ fontWeight: 400, color: '#a0aec0', fontSize: 11 }}>(opcional)</span></span>
                      {placa.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#a0aec0' }}>
                          {placa.length}/10
                        </span>
                      )}
                    </label>
                    <input
                      className="form-input"
                      value={placa}
                      maxLength={10}
                      onChange={e => setPlaca(e.target.value.toUpperCase())}
                      placeholder="ABC-123"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Color <span style={{ fontWeight: 400, color: '#a0aec0', fontSize: 11 }}>(opcional)</span>
                    </label>
                    <input
                      className="form-input"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      placeholder="Rojo, Negro mate, Azul metálico…"
                    />
                  </div>
                </div>
              </div>

              <div style={footerRow}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => goTo(clienteEncontrado ? 'SELECCIONAR_MOTO' : 'REGISTRAR_CLIENTE')}
                >
                  Atrás
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={
                    !marca.trim() ||
                    !modelo.trim() ||
                    (modelo === 'Otro modelo...' && !modeloOtro.trim()) ||
                    !numeroSerie.trim()
                  }
                  onClick={() => goTo('SERVICIO')}
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* ════════════════════ STEP: SERVICIO ════════════════════ */}
          {step === 'SERVICIO' && (
            <form onSubmit={handleSubmit}>

              {/* Resumen: cliente + moto */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {clienteId && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#f0fff4', border: '1px solid #9ae6b4',
                    borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#276749',
                  }}>
                    <User size={12} />
                    <span>{clienteEncontrado?.nombre ?? 'Cliente registrado'}</span>
                  </div>
                )}
                {motoSel ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#ebf8ff', border: '1px solid #bee3f8',
                    borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#2b6cb0',
                  }}>
                    <Bike size={12} />
                    <span>{motoSel.marca} {motoSel.modelo} · {motoSel.anio}</span>
                  </div>
                ) : marca && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#ebf8ff', border: '1px solid #bee3f8',
                    borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#2b6cb0',
                  }}>
                    <Bike size={12} />
                    <span>{marca} {modelo} · {anio}</span>
                  </div>
                )}
              </div>

              {/* Detalles del servicio */}
              <div style={sectionCard}>
                <div style={sectionHeader}>
                  <div style={iconCircle('#faf5ff')}>
                    <Wrench size={15} color="#805ad5" />
                  </div>
                  <span style={sectionTitle}>Detalles del servicio</span>
                </div>

                {/* Selector de tipo de servicio */}
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ClipboardList size={13} color="#805ad5" />
                      Tipo de servicio *
                    </span>
                  </label>
                  {loadingCatalogo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#718096', fontSize: 13, padding: '8px 0' }}>
                      <Loader2 size={14} className="icon-spin" /> Cargando servicios…
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {catalogoServicios.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#a0aec0', margin: 0 }}>
                          No hay servicios disponibles en el catálogo.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                          {catalogoServicios.map(s => {
                            const seleccionado = servicioSeleccionado?.id === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setServicioSeleccionado(s);
                                  setDescripcion('');
                                  // Auto-detectar si es reparación por la categoría del servicio
                                  setEsReparacion(s.categoria.toLowerCase().includes('reparac'));
                                  const precio = s.precio_base ? parseFloat(s.precio_base) : 0;
                                  if (precio > 0) {
                                    setManoDeObra(precio.toFixed(2));
                                    setPrecioDelCatalogo(true);
                                  } else {
                                    setManoDeObra('0.00');
                                    setPrecioDelCatalogo(false);
                                  }
                                }}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: 20,
                                  border: seleccionado
                                    ? '2px solid #805ad5'
                                    : '2px solid #e2e8f0',
                                  background: seleccionado ? '#faf5ff' : '#f7fafc',
                                  color: seleccionado ? '#553c9a' : '#718096',
                                  fontWeight: seleccionado ? 700 : 500,
                                  fontSize: 13,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                🔧 {s.nombre}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Indicador de flujo (solo lectura, se detecta automáticamente por categoría) */}
                {servicioSeleccionado && (
                  <div style={{
                    marginBottom: 14, padding: '8px 12px', borderRadius: 8,
                    background: esReparacion ? '#ebf8ff' : '#f0fff4',
                    border: `1px solid ${esReparacion ? '#bee3f8' : '#9ae6b4'}`,
                    fontSize: 12, color: esReparacion ? '#2b6cb0' : '#276749', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {esReparacion ? '🔍 Reparación — pasará a diagnóstico antes de iniciar' : '⚙️ Mantenimiento — pasará directo a taller'}
                  </div>
                )}

                {/* Campo de descripción: solo visible cuando es reparación */}
                {servicioSeleccionado && esReparacion && (
                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label">Descripción del problema *</label>
                    <textarea
                      className="form-input"
                      value={descripcion}
                      onChange={e => setDescripcion(e.target.value)}
                      rows={3}
                      placeholder="Describe la falla: ruido en motor, frenos flojos, no enciende…"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                )}

                <div style={grid2}>
                  <div>
                    <label className="form-label">Mano de obra ($)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute', left: 10, top: '50%',
                        transform: 'translateY(-50%)', color: '#718096', fontSize: 14, pointerEvents: 'none',
                      }}>$</span>
                      <input
                        className="form-input"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={manoDeObra}
                        onChange={e => {
                          setManoDeObra(e.target.value);
                          setPrecioDelCatalogo(false);
                        }}
                        onKeyDown={e => ['e','E','+','-'].includes(e.key) && e.preventDefault()}
                        style={{
                          paddingLeft: 22,
                          borderColor: precioDelCatalogo ? '#48bb78' : undefined,
                          boxShadow: precioDelCatalogo ? '0 0 0 2px rgba(72,187,120,0.2)' : undefined,
                        }}
                      />
                    </div>
                    {precioDelCatalogo && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#38a169', fontWeight: 600 }}>
                        Precio del catálogo
                      </p>
                    )}
                    {servicioSeleccionado && !precioDelCatalogo && (!servicioSeleccionado.precio_base || parseFloat(servicioSeleccionado.precio_base) === 0) && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#dd6b20', fontWeight: 500 }}>
                        Sin precio en catálogo — se definirá en diagnóstico
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Entrega estimada</label>
                    <input
                      className="form-input"
                      type="date"
                      value={fechaEstimada}
                      onChange={e => setFechaEstimada(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label className="form-label">
                    Notas internas{' '}
                    <span style={{ fontWeight: 400, color: '#a0aec0' }}>(solo visible para el taller)</span>
                  </label>
                  <textarea
                    className="form-input"
                    value={notasInternas}
                    onChange={e => setNotasInternas(e.target.value)}
                    rows={2}
                    placeholder="Observaciones extra para los mecánicos…"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Refacciones del servicio */}
              <div style={sectionCard}>
                <div style={sectionHeader}>
                  <div style={iconCircle('#fff5f0')}>
                    <Wrench size={15} color="#e53e3e" />
                  </div>
                  <span style={sectionTitle}>Refacciones</span>
                  {refacciones.length > 0 && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 11, color: '#718096',
                      background: '#f7fafc', padding: '2px 8px', borderRadius: 10,
                    }}>
                      {refacciones.length} ítem{refacciones.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Buscador */}
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{
                      position: 'absolute', left: 10, top: '50%',
                      transform: 'translateY(-50%)', color: '#a0aec0', pointerEvents: 'none',
                    }} />
                    <input
                      type="text"
                      value={busqRef}
                      onChange={e => handleBusqRef(e.target.value)}
                      placeholder="Buscar refacción por nombre…"
                      autoComplete="off"
                      style={{
                        width: '100%', padding: '9px 12px 9px 32px',
                        border: '1px solid #e2e8f0', borderRadius: 8,
                        fontSize: 13, color: '#2d3748', background: '#fff',
                        outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    {buscandoRef && (
                      <Loader2 size={14} className="icon-spin" style={{
                        position: 'absolute', right: 10, top: '50%',
                        transform: 'translateY(-50%)', color: '#a0aec0',
                      }} />
                    )}
                  </div>

                  {/* Dropdown */}
                  {resultadosRef.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden',
                    }}>
                      {resultadosRef.map(p => {
                        const stock = p.total_stock ?? 0;
                        const yaAgregado = refacciones.some(r => r.producto.id === p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => !yaAgregado && agregarRefaccion(p)}
                            style={{
                              padding: '10px 14px', cursor: yaAgregado ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              borderBottom: '1px solid #f7fafc', opacity: yaAgregado ? 0.5 : 1,
                              background: '#fff', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { if (!yaAgregado) (e.currentTarget as HTMLDivElement).style.background = '#ebf8ff'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>SKU: {p.sku} · ${p.price}</div>
                            </div>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                              background: stock > 0 ? '#f0fff4' : '#fff5f5',
                              color: stock > 0 ? '#276749' : '#c53030',
                              border: `1px solid ${stock > 0 ? '#9ae6b4' : '#fed7d7'}`,
                              whiteSpace: 'nowrap',
                            }}>
                              {yaAgregado ? 'Agregado' : stock > 0 ? `${stock} en stock` : 'Sin stock'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tabla de refacciones */}
                {refacciones.length > 0 && (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    {/* Header tabla */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 70px 90px 32px',
                      gap: 8, padding: '8px 12px',
                      background: '#f7fafc', fontSize: 11, fontWeight: 700,
                      color: '#718096', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      <span>Producto</span>
                      <span>Cant.</span>
                      <span>Precio $</span>
                      <span></span>
                    </div>
                    {/* Filas */}
                    {refacciones.map((r, idx) => (
                      <div
                        key={r.producto.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr 70px 90px 32px',
                          gap: 8, padding: '10px 12px', alignItems: 'center',
                          borderTop: idx === 0 ? 'none' : '1px solid #f0f4f8',
                          background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{r.producto.name}</div>
                          <div style={{ fontSize: 11, color: '#a0aec0' }}>
                            Subtotal: ${((parseFloat(r.precio_unitario) || 0) * r.cantidad).toFixed(2)}
                          </div>
                        </div>
                        <input
                          type="number" min="1" value={r.cantidad}
                          onChange={e => cambiarCantidadRef(r.producto.id, e.target.value)}
                          style={{
                            width: '100%', padding: '5px 8px', border: '1px solid #e2e8f0',
                            borderRadius: 6, fontSize: 13, textAlign: 'center',
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                        <input
                          type="number" min="0" step="0.01" value={r.precio_unitario}
                          onChange={e => cambiarPrecioRef(r.producto.id, e.target.value)}
                          style={{
                            width: '100%', padding: '5px 8px', border: '1px solid #e2e8f0',
                            borderRadius: 6, fontSize: 13,
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => quitarRefaccion(r.producto.id)}
                          style={{
                            background: '#fff5f5', border: '1px solid #fed7d7',
                            borderRadius: 6, color: '#c53030', cursor: 'pointer',
                            width: 28, height: 28, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: 0,
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    {/* Totales */}
                    <div style={{
                      padding: '10px 12px', borderTop: '2px solid #e2e8f0',
                      background: '#f7fafc', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 12, color: '#718096', fontWeight: 600 }}>Total refacciones</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#2d3748' }}>
                        ${totalRefacciones.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Resumen total general (mano de obra + refacciones) */}
                {(parseFloat(manoDeObra) > 0 || refacciones.length > 0) && (
                  <div style={{
                    marginTop: 12, padding: '12px 16px',
                    background: 'linear-gradient(135deg, #ebf8ff, #e6fffa)',
                    border: '1px solid #bee3f8', borderRadius: 10,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ fontSize: 12, color: '#2b6cb0' }}>
                      <div>Mano de obra: <strong>${parseFloat(manoDeObra || '0').toFixed(2)}</strong></div>
                      <div>Refacciones: <strong>${totalRefacciones.toFixed(2)}</strong></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#2b6cb0', fontWeight: 600 }}>TOTAL ESTIMADO</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#1a365d' }}>
                        ${totalGeneral.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Checklist de recepción */}
              <div style={sectionCard}>
                <div style={sectionHeader}>
                  <div style={iconCircle('#fffaf0')}>
                    <CheckSquare size={15} color="#dd6b20" />
                  </div>
                  <span style={sectionTitle}>Checklist de recepción</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, color: '#718096',
                    background: '#f7fafc', padding: '2px 8px', borderRadius: 10,
                  }}>
                    {checklist.length}/{CHECKLIST_ITEMS.length} ítems
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {CHECKLIST_ITEMS.map(item => {
                    const checked = checklist.includes(item);
                    return (
                      <label
                        key={item}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                          border: checked ? '1.5px solid #f6ad55' : '1.5px solid #e2e8f0',
                          background: checked ? '#fffaf0' : '#f7fafc',
                          transition: 'all 0.15s',
                          fontSize: 13, color: checked ? '#c05621' : '#4a5568',
                          fontWeight: checked ? 600 : 400,
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleChecklist(item)}
                          style={{ width: 15, height: 15, accentColor: '#dd6b20', cursor: 'pointer', flexShrink: 0 }}
                        />
                        {item}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Imágenes de evidencia */}
              <div style={sectionCard}>
                <div style={sectionHeader}>
                  <div style={iconCircle('#f0f4ff')}>
                    <Camera size={15} color="#4c51bf" />
                  </div>
                  <span style={sectionTitle}>Imágenes de evidencia</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, color: '#718096',
                    background: '#f7fafc', padding: '2px 8px', borderRadius: 10,
                  }}>
                    {imagenes.length}/8
                  </span>
                </div>

                {/* Miniaturas */}
                {previews.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 12 }}>
                    {previews.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative', width: 72, height: 72, borderRadius: 8,
                          overflow: 'hidden', border: '2px solid #e2e8f0', flexShrink: 0,
                        }}
                      >
                        <img
                          src={url}
                          alt={`evidencia-${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuitarImagen(idx)}
                          style={{
                            position: 'absolute', top: 2, right: 2,
                            background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%',
                            width: 18, height: 18, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0,
                          }}
                        >
                          <X size={11} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Zona de carga */}
                {imagenes.length < 8 && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={e => handleAgregarImagenes(e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100%', padding: '14px', borderRadius: 8,
                        border: '1.5px dashed #a3bffa', background: '#f0f4ff',
                        color: '#4c51bf', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.15s',
                      }}
                    >
                      <ImageIcon size={16} /> Agregar fotos de la moto al recibirla
                    </button>
                    {isOffline && imagenes.length > 0 && (
                      <p style={{
                        fontSize: 12, color: '#975a16', background: '#fffbeb',
                        border: '1px solid #fbd38d', borderRadius: 6,
                        padding: '6px 10px', marginTop: 6,
                      }}>
                        Sin conexión: las imágenes no se subirán. El servicio se creará sin fotos.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Pago */}
              <div style={{
                ...sectionCard,
                background:   pagarAhora ? '#f0fff4' : '#f7fafc',
                borderColor:  pagarAhora ? '#9ae6b4' : '#e2e8f0',
                transition:   'all 0.2s',
              }}>
                <div style={sectionHeader}>
                  <div style={iconCircle(pagarAhora ? '#c6f6d5' : '#e2e8f0')}>
                    <CreditCard size={15} color={pagarAhora ? '#276749' : '#718096'} />
                  </div>
                  <span style={{ ...sectionTitle, color: pagarAhora ? '#276749' : '#2d3748' }}>
                    Pago al recibir
                  </span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#2d3748' }}>
                  <input
                    type="checkbox"
                    checked={pagarAhora}
                    onChange={e => setPagarAhora(e.target.checked)}
                    style={{ width: 17, height: 17, accentColor: '#38a169', cursor: 'pointer' }}
                  />
                  <span>El cliente <strong>paga por adelantado</strong> en este momento</span>
                </label>

                {pagarAhora && (() => {
                  const fmtMXN = (n: number) =>
                    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
                  const servicioNombre = esReparacion
                    ? (descripcion.trim() || 'Reparación a diagnóstico')
                    : (servicioSeleccionado?.nombre ?? 'Servicio de taller');
                  const montoInsuficiente = metodo === 'EFECTIVO' && montoPagado !== '' && montoPagadoNum < totalGeneral;

                  return (
                    <div style={{ marginTop: 16 }}>
                      {/* ── Lista de ítems (estilo PaymentModal de caja) ── */}
                      <div className="payment-items-list">
                        {/* Mano de obra */}
                        <div className="payment-item-row">
                          <span style={{ flex: 1 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#718096',
                              textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 6 }}>
                              Servicio
                            </span>
                            {servicioNombre}
                          </span>
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {fmtMXN(parseFloat(manoDeObra) || 0)}
                          </span>
                        </div>

                        {/* Refacciones */}
                        {refacciones.map(r => (
                          <div key={r.producto.id} className="payment-item-row">
                            <span style={{ flex: 1 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#718096',
                                textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 6 }}>
                                Refacción
                              </span>
                              {r.producto.name}
                              {r.cantidad > 1 && (
                                <span style={{ color: '#a0aec0', fontSize: 12, marginLeft: 4 }}>
                                  × {r.cantidad}
                                </span>
                              )}
                            </span>
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {fmtMXN((parseFloat(r.precio_unitario) || 0) * r.cantidad)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <hr className="payment-divider" />

                      {/* ── Resumen de totales ── */}
                      {refacciones.length > 0 && (
                        <div className="payment-summary-row">
                          <span>Mano de obra</span>
                          <span>{fmtMXN(parseFloat(manoDeObra) || 0)}</span>
                        </div>
                      )}
                      {refacciones.length > 0 && (
                        <div className="payment-summary-row">
                          <span>Refacciones</span>
                          <span>{fmtMXN(totalRefacciones)}</span>
                        </div>
                      )}
                      <div className="payment-summary-row payment-summary-row--total">
                        <span>Total</span>
                        <span>{fmtMXN(totalGeneral)}</span>
                      </div>

                      <hr className="payment-divider" />

                      {/* ── Método de pago ── */}
                      <div style={{ marginBottom: 12 }}>
                        <label className="form-label">Método de pago</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {METODOS_PAGO.map(m => (
                            <button
                              key={m.value}
                              type="button"
                              onClick={() => setMetodo(m.value)}
                              style={{
                                flex: 1, padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                                border:     metodo === m.value ? '2px solid #38a169' : '2px solid #e2e8f0',
                                background: metodo === m.value ? '#f0fff4' : '#fff',
                                color:      metodo === m.value ? '#276749' : '#718096',
                                fontWeight: metodo === m.value ? 700 : 500,
                                fontSize: 13, transition: 'all 0.15s',
                              }}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── Efectivo: monto recibido + cambio ── */}
                      {metodo === 'EFECTIVO' ? (
                        <>
                          <div className="payment-summary-row" style={{ alignItems: 'center', gap: 10 }}>
                            <span style={{ flexShrink: 0 }}>Monto recibido</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="0.01"
                              value={montoPagado}
                              onChange={e => setMontoPagado(e.target.value)}
                              placeholder={`Mín. ${fmtMXN(totalGeneral)}`}
                              style={{
                                textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                                border: `1px solid ${montoInsuficiente ? '#fc8181' : '#e2e8f0'}`,
                                borderRadius: 6, padding: '5px 10px', fontSize: 14,
                                width: 130, background: '#fff', outline: 'none',
                                color: montoInsuficiente ? '#c53030' : '#2d3748',
                              }}
                            />
                          </div>

                          {montoPagado !== '' && (
                            montoInsuficiente ? (
                              <p style={{
                                margin: '6px 0', padding: '6px 10px',
                                background: '#fff5f5', border: '1px solid #fc8181',
                                borderRadius: 6, color: '#c53030', fontSize: 12,
                              }}>
                                Monto insuficiente. Debe ser ≥ {fmtMXN(totalGeneral)}
                              </p>
                            ) : (
                              <div className="payment-summary-row" style={{ color: '#276749' }}>
                                <span style={{ fontWeight: 600 }}>Cambio</span>
                                <span style={{ fontWeight: 700, fontSize: 16 }}>
                                  {fmtMXN(cambioCalculado ?? 0)}
                                </span>
                              </div>
                            )
                          )}
                        </>
                      ) : (
                        /* Tarjeta / Transferencia: pago exacto */
                        <div className="payment-summary-row">
                          <span>Monto a cobrar</span>
                          <span style={{ fontWeight: 600, color: '#2b6cb0' }}>
                            {fmtMXN(totalGeneral)} <span style={{ fontSize: 11, color: '#a0aec0' }}>(exacto)</span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div style={footerRow}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => goTo(motoSeleccionadaId ? 'SELECCIONAR_MOTO' : 'NUEVA_MOTO')}
                  disabled={loading}
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading || subiendo}
                  style={{ minWidth: 140 }}
                >
                  {subiendo ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Loader2 size={14} className="icon-spin" /> Subiendo imágenes…
                    </span>
                  ) : loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Loader2 size={14} className="icon-spin" /> Guardando…
                    </span>
                  ) : '✓ Crear servicio'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default NuevoServicioModal;
