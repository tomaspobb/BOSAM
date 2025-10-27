'use client';
import { useEffect, useState, FormEvent } from "react";
import { Modal } from "react-bootstrap";

type Client = { _id: string; name: string; code: string };

type UploadedFile = {
  url: string;
  name?: string;
  size?: number;
  type?: string;
};

type ServiceItem = {
  label: string;
  unitPrice: number;
  qty: number;
  files: UploadedFile[];
  subtotal: number;
};

const PRESETS = [
  { label: "Post IG", base: 25000 },
  { label: "POP", base: 40000 },
  { label: "Fotomontaje", base: 35000 },
  { label: "Retoque", base: 20000 },
  { label: "Cambio color", base: 15000 },
];

export default function NuevoProyectoButton({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [show, setShow] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([]);

  const total = services.reduce((sum, s) => sum + (s.subtotal || 0), 0);

  useEffect(() => {
    if (show) {
      fetch("/api/clients")
        .then((r) => r.json())
        .then(setClients);
    }
  }, [show]);

  // --- Añadir preset ---
  function togglePreset(preset: { label: string; base: number }) {
    const idx = services.findIndex((s) => s.label === preset.label);
    if (idx >= 0) {
      setServices((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setServices((prev) => [
        ...prev,
        {
          label: preset.label,
          unitPrice: preset.base,
          qty: 1,
          subtotal: preset.base,
          files: [],
        },
      ]);
    }
  }

  // --- Actualizar cantidad o precio ---
  function updateQty(i: number, qty: number) {
    setServices((prev) => {
      const cp = [...prev];
      cp[i].qty = qty;
      cp[i].subtotal = (cp[i].unitPrice || 0) * qty;
      return cp;
    });
  }

  function updatePrice(i: number, price: number) {
    setServices((prev) => {
      const cp = [...prev];
      cp[i].unitPrice = price;
      cp[i].subtotal = (price || 0) * (cp[i].qty || 1);
      return cp;
    });
  }

  // --- Subida múltiple ---
  async function uploadToService(i: number, files: FileList | null) {
    if (!files || !files.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const res = await fetch("/api/upload/batch", { method: "POST", body: fd });
    const { files: uploaded } = await res.json();
    setServices((prev) => {
      const cp = [...prev];
      cp[i].files = [...(cp[i].files || []), ...uploaded];
      return cp;
    });
  }

  // --- Guardar proyecto ---
  async function save() {
    if (!clientId) return alert("Selecciona un cliente");
    const body = {
      clientId,
      date,
      note,
      services: services.map((s) => ({
        label: s.label,
        unitPrice: s.unitPrice,
        qty: s.qty,
        files: s.files,
      })),
    };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Error guardando");
      return;
    }

    setShow(false);
    setClientId("");
    setNote("");
    setServices([]);
    onCreated?.();
  }

  // --- Eliminar servicio ---
  function removeService(i: number) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <>
      <button className="btn-bosam" onClick={() => setShow(true)}>
        + Nuevo
      </button>

      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Nuevo Proyecto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Cliente */}
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select
              className="form-control"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">— Selecciona —</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Presets */}
          <div className="form-group">
            <label className="form-label">Servicios</label>
            <div className="d-flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const active = services.some((s) => s.label === p.label);
                return (
                  <button
                    key={p.label}
                    type="button"
                    className={`btn ${
                      active ? "btn-bosam" : "btn-outline-dark"
                    }`}
                    onClick={() => togglePreset(p)}
                  >
                    {p.label} (${p.base.toLocaleString()})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de servicios con cantidad e imágenes */}
          {services.map((s, idx) => (
            <div
              key={idx}
              className="border rounded p-2 mb-3"
              style={{ background: "#fff" }}
            >
              <div className="d-flex flex-wrap align-items-end gap-3">
                <div>
                  <label className="form-label">Servicio</label>
                  <input
                    className="form-control"
                    value={s.label}
                    onChange={(e) => {
                      const v = e.target.value;
                      setServices((prev) => {
                        const cp = [...prev];
                        cp[idx].label = v;
                        return cp;
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="form-label">Precio Unitario</label>
                  <input
                    type="number"
                    className="form-control"
                    value={s.unitPrice}
                    onChange={(e) => updatePrice(idx, Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="form-label">Cantidad</label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    value={s.qty}
                    onChange={(e) => updateQty(idx, Number(e.target.value))}
                  />
                </div>

                <div className="ms-auto text-end">
                  <div className="text-muted small">Subtotal</div>
                  <div className="fw-bold">${s.subtotal.toLocaleString()}</div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger ms-2"
                  onClick={() => removeService(idx)}
                >
                  Quitar
                </button>
              </div>

              <div className="mt-2">
                <label className="form-label">Imágenes (múltiples)</label>
                <input
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => uploadToService(idx, e.target.files)}
                />
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {(s.files || []).map((f, k) => (
                    <img
                      key={k}
                      src={f.url}
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Nota */}
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-control"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted">Total</div>
            <div className="h5 m-0">${total.toLocaleString()}</div>
          </div>
        </Modal.Body>

        <div className="d-flex justify-content-end gap-2 p-3 pt-0">
          <button className="btn btn-outline-dark" onClick={() => setShow(false)}>
            Cancelar
          </button>
          <button className="btn-bosam" onClick={save}>
            Guardar
          </button>
        </div>
      </Modal>
    </>
  );
}