'use client';

import { useEffect, useState } from 'react';
import NuevoProyectoButton from '@/components/NuevoProyectoButton';

type Project = {
  _id: string;
  clientId: { name: string; code: string };
  date: string;
  total: number;
  note?: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const data = await fetch('/api/projects').then((r) => r.json());
    setProjects(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="container-fluid py-5 px-4" style={{ minHeight: '100vh' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h1 className="fw-bold display-5 m-0">Proyectos</h1>
        <NuevoProyectoButton onCreated={load} />
      </div>

      <div
        className="bg-white shadow-sm rounded-4 p-4"
        style={{ maxWidth: '100%', width: '100%', minHeight: '60vh' }}
      >
        {loading ? (
          <div className="text-muted">Cargando proyectos...</div>
        ) : projects.length === 0 ? (
          <div className="text-muted text-center py-5 fs-5">
            Aún no hay proyectos. Crea el primero con <strong>“+ Nuevo”</strong>.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Obs</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong>{p.clientId?.name}</strong>{' '}
                      <span className="text-muted">({p.clientId?.code})</span>
                    </td>
                    <td>{p.date}</td>
                    <td>${(p.total || 0).toLocaleString()}</td>
                    <td
                      className="text-truncate"
                      style={{ maxWidth: 300 }}
                      title={p.note || ''}
                    >
                      {p.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
