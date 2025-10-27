'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';

type Client = { _id: string; name: string; code: string };

type LocalFile = {
  file: File;
  previewUrl: string;
  key: string; // name|size|lastModified
};

type ServiceItem = {
  label: string;
  unitPrice: number;
  qty: number;
  subtotal: number;
  files: LocalFile[]; // SOLO local hasta guardar
};

const PRESETS: { label: string; base: number }[] = [
  { label: 'Post IG', base: 25000 },
  { label: 'POP', base: 40000 },
  { label: 'Fotomontaje', base: 35000 },
  { label: 'Retoque', base: 20000 },
  { label: 'Cambio color', base: 15000 },
];

const fmt = new Intl.NumberFormat('es-CL');
const MAX_FILE_MB = 12;

export default function NuevoProyectoButton({ onCreated }: { onCreated?: () => void }) {
  const [show, setShow] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [saving, setSaving] = useState(false);

  // refs por servicio para el input oculto
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const total = useMemo(
    () => services.reduce((sum, s) => sum + (s.subtotal || 0), 0),
    [services]
  );

  useEffect(() => {
    if (!show) return;
    fetch('/api/clients').then(r => r.json()).then(setClients).catch(() => setClients([]));
  }, [show]);

  // liberar objectURLs
  useEffect(() => {
    if (!show) return;
    return () => services.forEach(s => s.files?.forEach(f => URL.revokeObjectURL(f.previewUrl)));
  }, [show, services]);

  /* -------- servicios -------- */
  function addCustomService() {
    setServices(p => [...p, { label: 'Servicio', unitPrice: 0, qty: 1, subtotal: 0, files: [] }]);
  }
  function togglePreset(preset: { label: string; base: number }) {
    const idx = services.findIndex(s => s.label === preset.label);
    if (idx >= 0) removeService(idx);
    else setServices(p => [...p, { label: preset.label, unitPrice: preset.base, qty: 1, subtotal: preset.base, files: [] }]);
  }
  function updateLabel(i: number, v: string) {
    setServices(p => { const c=[...p]; c[i].label=v; return c; });
  }
  function updatePrice(i: number, price: number) {
    setServices(p => { const c=[...p]; const val=Math.max(0, Number.isFinite(price)?price:0); c[i].unitPrice=val; c[i].subtotal=val*(c[i].qty||1); return c; });
  }
  function updateQty(i: number, qty: number) {
    setServices(p => { const c=[...p]; const q=Math.max(1, Math.floor(Number.isFinite(qty)?qty:1)); c[i].qty=q; c[i].subtotal=(c[i].unitPrice||0)*q; return c; });
  }
  function removeService(i: number) {
    services[i]?.files?.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setServices(p => p.filter((_,idx)=>idx!==i));
  }

  /* -------- archivos: SOLO local -------- */
  function validateFiles(list: FileList | null) {
    if (!list || !list.length) return true;
    const max = MAX_FILE_MB * 1024 * 1024;
    for (const f of Array.from(list)) {
      if (f.size > max) { alert(`"${f.name}" supera ${MAX_FILE_MB} MB`); return false; }
    }
    return true;
  }

  function onPickFiles(serviceIdx: number, list: FileList | null) {
    if (!list || !list.length) return;
    if (!validateFiles(list)) return;

    setServices(prev => {
      const cp = [...prev];
      const current = cp[serviceIdx]?.files || [];

      const exists = new Set(current.map(f => f.key));
      const toAdd: LocalFile[] = [];

      for (const file of Array.from(list)) {
        const key = `${file.name}|${file.size}|${file.lastModified}`;
        if (exists.has(key)) continue; // dedupe
        toAdd.push({ file, previewUrl: URL.createObjectURL(file), key });
        exists.add(key);
      }

      cp[serviceIdx].files = [...current, ...toAdd];
      return cp;
    });

    // limpiar el valor para permitir elegir el mismo archivo de nuevo
    const input = fileInputs.current[serviceIdx];
    if (input) input.value = '';
  }

  function openPicker(si: number) {
    const el = fileInputs.current[si];
    if (!el) return;
    el.value = ''; // MUY importante
    el.click();
  }

  function removeFile(serviceIdx: number, fileIdx: number) {
    const lf = services[serviceIdx].files[fileIdx];
    if (lf) URL.revokeObjectURL(lf.previewUrl);
    setServices(prev => {
      const cp = [...prev];
      cp[serviceIdx].files = cp[serviceIdx].files.filter((_, i) => i !== fileIdx);
      return cp;
    });
  }

  /* -------- guardar (recién sube) -------- */
  async function save() {
    if (!clientId) return alert('Selecciona un cliente');
    if (services.length === 0) return alert('Agrega al menos un servicio');

    try {
      setSaving(true);

      const payload = {
        clientId, date, note,
        services: services.map(s => ({ label: s.label, unitPrice: s.unitPrice, qty: s.qty })),
      };

      const fd = new FormData();
      fd.append('payload', JSON.stringify(payload));
      services.forEach((s, si) => s.files.forEach(lf => fd.append(`files[${si}]`, lf.file)));

      const res = await fetch('/api/projects', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Error guardando');
      }

      services.forEach(s => s.files?.forEach(f => URL.revokeObjectURL(f.previewUrl)));
      setShow(false); setClientId(''); setNote(''); setServices([]);
      onCreated?.();
    } catch (e:any) {
      alert(e?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className="btn-bosam" onClick={() => setShow(true)}>+ Nuevo</button>

      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>Nuevo Proyecto</Modal.Title></Modal.Header>

        <Modal.Body>
          {/* Cliente */}
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select className="form-control" value={clientId} onChange={e=>setClientId(e.target.value)}>
              <option value="">— Selecciona —</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
            </select>
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input type="date" className="form-control" value={date} onChange={e=>setDate(e.target.value)} />
          </div>

          {/* Presets */}
          <div className="form-group">
            <label className="form-label">Servicios</label>
            <div className="d-flex flex-wrap gap-2">
              {PRESETS.map(p => {
                const active = services.some(s => s.label === p.label);
                return (
                  <button
                    key={p.label}
                    type="button"
                    className={`btn ${active ? 'btn-bosam' : 'btn-outline-dark'}`}
                    onClick={() => togglePreset(p)}
                    disabled={saving}
                  >
                    {p.label} (${fmt.format(p.base)})
                  </button>
                );
              })}
              <button type="button" className="btn btn-outline-dark" onClick={addCustomService} disabled={saving}>
                + Servicio personalizado
              </button>
            </div>
          </div>

          {/* Servicios */}
          {services.map((s, idx) => (
            <div key={idx} className="border rounded p-2 mb-3" style={{ background:'#fff' }}>
              <div className="d-flex flex-wrap align-items-end gap-3">
                <div>
                  <label className="form-label">Servicio</label>
                  <input className="form-control" value={s.label} onChange={e=>updateLabel(idx, e.target.value)} disabled={saving}/>
                </div>
                <div>
                  <label className="form-label">Precio Unitario</label>
                  <input type="number" className="form-control" value={s.unitPrice} onChange={e=>updatePrice(idx, Number(e.target.value))} disabled={saving}/>
                </div>
                <div>
                  <label className="form-label">Cantidad</label>
                  <input type="number" min={1} className="form-control" value={s.qty} onChange={e=>updateQty(idx, Number(e.target.value))} disabled={saving}/>
                </div>

                <div className="ms-auto text-end">
                  <div className="text-muted small">Subtotal</div>
                  <div className="fw-bold">${fmt.format(s.subtotal)}</div>
                </div>

                <button type="button" className="btn btn-sm btn-link text-danger ms-2" onClick={()=>removeService(idx)} disabled={saving}>
                  Quitar
                </button>
              </div>

              {/* Archivos (input oculto + botón visible) */}
              <div className="mt-2">
                <label className="form-label d-block">Archivos (múltiples)</label>

                <input
                  ref={el => { fileInputs.current[idx] = el; }}
                  type="file"
                  multiple
                  // acepta todas las imágenes + pdf
                  accept="image/*,application/pdf"
                  onChange={e => onPickFiles(idx, e.currentTarget.files)}
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => openPicker(idx)}
                  disabled={saving}
                >
                  Elegir archivos
                </button>

                <div className="d-flex flex-wrap gap-2 mt-2" style={{ minHeight: 100 }}>
                  {(s.files || []).map((lf, k) => {
                    const isImg = lf.file.type.startsWith('image/');
                    return (
                      <div key={lf.key} className="position-relative">
                        {isImg ? (
                          <img
                            src={lf.previewUrl}
                            alt={lf.file.name}
                            style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center"
                            style={{ width: 140, height: 40, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fafafa', fontSize: 12, padding: '0 8px' }}
                          >
                            {lf.file.name}
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0 position-absolute"
                          style={{ right: 4, top: -6 }}
                          onClick={() => removeFile(idx, k)}
                          disabled={saving}
                          title="Quitar archivo"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Nota */}
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea className="form-control" rows={3} value={note} onChange={e=>setNote(e.target.value)} disabled={saving}/>
          </div>

          {/* Total */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted">Total</div>
            <div className="h5 m-0">${fmt.format(total)}</div>
          </div>
        </Modal.Body>

        <div className="d-flex justify-content-end gap-2 p-3 pt-0">
          <button className="btn btn-outline-dark" onClick={()=>setShow(false)} disabled={saving}>Cancelar</button>
          <button className="btn-bosam" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </Modal>
    </>
  );
}
