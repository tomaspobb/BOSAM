'use client';
import { useEffect, useState, FormEvent } from "react";
import { Modal } from "react-bootstrap";

type Client = { _id:string; name:string; code:string };
type ServiceItem = { name:string; price:number };

const PRESETS: {label:string; base?:number}[] = [
  { label: "Post IG",       base: 25000 },
  { label: "POP",           base: 40000 },
  { label: "Fotomontaje",   base: 35000 },
  { label: "Retoque",       base: 20000 },
  { label: "Cambio color",  base: 15000 },
];

export default function NuevoProyectoButton({ onCreated }: { onCreated?: () => void }) {
  const [show, setShow] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [note, setNote] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);

  const total = services.reduce((s, it) => s + (it.price || 0), 0);

  useEffect(() => {
    if (show) { fetch("/api/clients").then(r=>r.json()).then(setClients); }
  }, [show]);

  function addService(e?: FormEvent){
    e?.preventDefault();
    if (!serviceName || !servicePrice) return;
    setServices(prev => [...prev, { name: serviceName, price: Number(servicePrice) }]);
    setServiceName(""); setServicePrice("");
  }
  function removeService(i:number){ setServices(prev => prev.filter((_,idx)=>idx!==i)); }

  function togglePreset(preset:{label:string;base?:number}){
    const exists = services.findIndex(s => s.name === preset.label);
    if (exists >= 0) { removeService(exists); return; }
    setServices(prev => [...prev, { name: preset.label, price: preset.base ?? 0 }]);
  }

  async function uploadFile(): Promise<string | undefined> {
    if (!file) return undefined;
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method:"POST", body: fd });
    if (!res.ok) throw new Error("No se pudo subir el archivo");
    const { url } = await res.json(); return url;
  }

  async function save(){
    if (!clientId) return alert("Selecciona un cliente");
    const fileUrl = await uploadFile().catch(()=>undefined);
    const res = await fetch("/api/projects", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ clientId, services, total, date, note, fileUrl }),
    });
    if (!res.ok){ const j = await res.json().catch(()=>({})); alert(j.error||"Error"); return; }
    setShow(false); setServices([]); setNote(""); setFile(null); setClientId("");
    onCreated?.();
  }

  return (
    <>
      <button className="btn-bosam" onClick={()=>setShow(true)}>+ Nuevo</button>

      <Modal show={show} onHide={()=>setShow(false)} centered>
        <Modal.Header closeButton><Modal.Title>Nuevo proyecto</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select className="form-control" value={clientId} onChange={e=>setClientId(e.target.value)}>
              <option value="">— Selecciona —</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input type="date" className="form-control" value={date} onChange={e=>setDate(e.target.value)} />
          </div>

          {/* Chips de servicios predefinidos */}
          <div className="form-group">
            <label className="form-label">Servicios (elige uno o varios)</label>
            <div className="d-flex flex-wrap gap-2">
              {PRESETS.map(p => {
                const active = services.some(s=>s.name===p.label);
                return (
                  <button
                    key={p.label}
                    type="button"
                    className={`btn ${active? 'btn-bosam':'btn-outline-dark'}`}
                    onClick={()=>togglePreset(p)}
                  >
                    {p.label}{p.base ? ` ($${p.base.toLocaleString()})` : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agregar servicio manual */}
          <div className="form-group">
            <div className="d-flex gap-2">
              <input className="form-control" placeholder="Servicio personalizado"
                     value={serviceName} onChange={e=>setServiceName(e.target.value)}/>
              <input className="form-control" type="number" placeholder="$"
                     value={servicePrice} onChange={e=>setServicePrice(e.target.value as any)} style={{maxWidth:140}}/>
              <button className="btn btn-outline-dark" onClick={addService}>Agregar</button>
            </div>
          </div>

          {services.length>0 && (
            <ul className="mb-3">
              {services.map((s,idx)=>(
                <li key={idx} className="d-flex justify-content-between align-items-center">
                  <span>{s.name}</span>
                  <span>
                    ${s.price.toLocaleString()}{" "}
                    <button className="btn btn-sm btn-link text-danger" onClick={()=>removeService(idx)}>quitar</button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="form-group">
            <label className="form-label">Archivo (PNG/JPG/PDF)</label>
            <input type="file" className="form-control" accept=".png,.jpg,.jpeg,.pdf"
                   onChange={e=>setFile(e.target.files?.[0]||null)} />
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea className="form-control" rows={3} value={note} onChange={e=>setNote(e.target.value)} />
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted">Total</div>
            <div className="h5 m-0">${total.toLocaleString()}</div>
          </div>
        </Modal.Body>

        <div className="d-flex justify-content-end gap-2 p-3 pt-0">
          <button className="btn btn-outline-dark" onClick={()=>setShow(false)}>Cancelar</button>
          <button className="btn-bosam" onClick={save}>Guardar</button>
        </div>
      </Modal>
    </>
  );
}
