'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Client = { _id: string; name: string; code: string };
type Project = {
  _id: string;
  clientId: { name: string; code: string };
  date: string;
  total: number;
  services: { label: string; qty: number; subtotal: number }[];
};

/* =============== helpers de descarga =============== */
async function fetchAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = 'Error en la descarga';
    try { msg = await res.text(); } catch {}
    throw new Error(msg);
  }
  return await res.blob();
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
/* =================================================== */

export default function ReportsPage() {
  const today = new Date();
  const defMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [month, setMonth] = useState(defMonth); // YYYY-MM
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  /* clientes */
  useEffect(() => {
    (async () => {
      try {
        const cs = await fetch('/api/clients').then((r) => r.json());
        setClients(cs || []);
      } catch {
        setClients([]);
      }
    })();
  }, []);

  /* proyectos según filtros */
  async function load() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      if (clientId) params.set('clientId', clientId);
      const data = await fetch(`/api/projects?${params.toString()}`).then((r) => r.json());
      setProjects(data || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [month, clientId]);

  const sumTotal = useMemo(
    () => projects.reduce((s, p) => s + (p.total || 0), 0),
    [projects]
  );

  /* exportar Excel */
  async function downloadExcel() {
    const params = new URLSearchParams();
    params.set('month', month);
    if (clientId) params.set('clientId', clientId);
    const url = `/api/export/excel?${params.toString()}`;

    await toast.promise(
      fetchAsBlob(url).then((blob) =>
        downloadBlob(blob, `Bosam_${month}${clientId ? `_${clientId}` : ''}.xlsx`)
      ),
      { loading: 'Generando Excel…', success: 'Excel descargado', error: 'No se pudo generar el Excel' }
    );
  }

  /* exportar PPT */
  async function downloadPpt(projectId: string, filename = 'Proyecto.pptx') {
    const url = `/api/export/pptx?projectId=${projectId}`;
    await toast.promise(
      fetchAsBlob(url).then((blob) => downloadBlob(blob, filename)),
      { loading: 'Creando PPT…', success: 'PPT descargado', error: 'No se pudo generar el PPT' }
    );
  }

  return (
    <main className="container-fluid py-5 px-4" style={{ minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h1 className="fw-bold display-5 m-0">Reportes</h1>
        <button className="btn-bosam btn-lg" onClick={downloadExcel}>
          Exportar Excel
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white shadow-sm rounded-4 p-4 mb-4" style={{ width: '100%' }}>
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label fw-semibold">Mes</label>
            <input
              type="month"
              className="form-control"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="col-md-5">
            <label className="form-label fw-semibold">Cliente</label>
            <select
              className="form-control"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">— Todos —</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4 text-end">
            <div className="text-muted small">Total del periodo</div>
            <div className="display-6 m-0 fw-semibold">${sumTotal.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white shadow-sm rounded-4 p-4" style={{ width: '100%', minHeight: '60vh' }}>
        <div className="d-flex justify-content-between mb-3">
          <div className="text-muted small">
            {loading ? 'Cargando…' : `${projects.length} proyectos`}
          </div>
          <Link href="/projects" className="text-muted small">
            Ir a Proyectos →
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Servicios</th>
                <th>Total</th>
                <th>PPT</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5">
                    Sin proyectos para el filtro seleccionado
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.clientId?.name}{' '}
                      <span className="text-muted">({p.clientId?.code})</span>
                    </td>
                    <td>{p.date}</td>
                    <td style={{ maxWidth: 520 }}>
                      <div className="text-truncate">
                        {p.services?.map((s, i) => (
                          <span key={i}>
                            {s.label}×{s.qty}
                            {i < p.services.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>${(p.total || 0).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() =>
                          downloadPpt(
                            p._id,
                            `Proyecto_${(p.clientId?.code || 'CL')}_${p._id.slice(-6)}.pptx`
                          )
                        }
                      >
                        Descargar PPT
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
