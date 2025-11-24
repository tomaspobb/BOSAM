'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaUsers, FaTasks, FaDollarSign } from 'react-icons/fa';

type Client = { _id: string; name: string; code: string };
type Project = {
  _id: string;
  clientId: { name: string; code: string } | string;
  date: string; // se asume algo tipo "2025-11-13"
  total: number;
  note?: string;
};

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cs, ps] = await Promise.all([
          fetch('/api/clients').then(r => r.json()),
          // 👇 importante que /api/projects POPULE el clientId
          fetch('/api/projects?limit=20').then(r => r.json()),
        ]);
        setClients(Array.isArray(cs) ? cs : []);
        setProjects(Array.isArray(ps) ? ps : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- FILTRO POR MES ACTUAL ---
  const now = new Date();
  const currentMonth = now.getMonth(); // 0–11
  const currentYear = now.getFullYear();

  const projectsThisMonth = useMemo(() => {
    return projects.filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [projects, currentMonth, currentYear]);

  const totalMonth = useMemo(
    () => projectsThisMonth.reduce((s, p) => s + (p.total || 0), 0),
    [projectsThisMonth]
  );

  return (
    <main className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
        <div>
          <h1 className="page-title mb-1">Panel general</h1>
          <div className="text-muted">Resumen del mes</div>
        </div>
        <div className="d-flex gap-2">
          <Link href="/clients" className="btn btn-outline-dark">+ Cliente</Link>
          <Link href="/projects" className="btn-bosam">+ Proyecto</Link>
        </div>
      </div>

      {/* Métricas (full-width) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card-bosam h-100 d-flex align-items-center gap-3 p-3">
            <div className="stat-icon"><FaUsers /></div>
            <div>
              <div className="text-muted small">Clientes</div>
              <div className="h3 m-0">{clients.length}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card-bosam h-100 d-flex align-items-center gap-3 p-3">
            <div className="stat-icon"><FaTasks /></div>
            <div>
              <div className="text-muted small">Proyectos</div>
              <div className="h3 m-0">{projects.length}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card-bosam h-100 d-flex align-items-center gap-3 p-3">
            <div className="stat-icon"><FaDollarSign /></div>
            <div>
              <div className="text-muted small">Total mensual</div>
              <div className="h3 m-0">${totalMonth.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Listas lado a lado ocupando más espacio */}
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card-bosam h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 m-0">Clientes registrados</h2>
              <Link href="/clients" className="text-muted">Ver todos →</Link>
            </div>
            {loading ? (
              <div className="text-muted">Cargando…</div>
            ) : clients.length === 0 ? (
              <div className="text-muted">Aún no hay clientes</div>
            ) : (
              <ul className="list-unstyled mb-0">
                {clients.slice(0, 10).map(c => (
                  <li key={c._id} className="py-1">
                    <strong>{c.name}</strong>{' '}
                    <span className="text-muted">({c.code})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card-bosam h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 m-0">Proyectos recientes</h2>
              <Link href="/projects" className="text-muted">Ver todos →</Link>
            </div>

            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Obs</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-muted">Cargando…</td>
                    </tr>
                  ) : projectsThisMonth.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-muted">Sin registros</td>
                    </tr>
                  ) : (
                    projectsThisMonth.slice(0, 12).map((p: any) => (
                      <tr key={p._id}>
                        <td>
                          {typeof p.clientId === 'object'
                            ? p.clientId?.name
                            : '—'}
                          {typeof p.clientId === 'object' && (
                            <span className="text-muted"> ({p.clientId?.code})</span>
                          )}
                        </td>
                        <td>{p.date}</td>
                        <td>${(p.total || 0).toLocaleString()}</td>
                        <td className="text-truncate" style={{ maxWidth: 260 }}>
                          {p.note || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
