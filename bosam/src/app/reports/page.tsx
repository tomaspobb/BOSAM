'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Client = { _id:string; name:string; code:string };
type Project = {
  _id:string;
  clientId:{ name:string; code:string };
  date:string;
  total:number;
  services:{ label:string; qty:number; subtotal:number }[];
};

export default function ReportsPage(){
  const today = new Date();
  const defMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

  const [month, setMonth] = useState(defMonth);      // YYYY-MM
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ (async()=>{
    const cs = await fetch('/api/clients').then(r=>r.json());
    setClients(cs);
  })() },[]);

  async function load(){
    setLoading(true);
    const params = new URLSearchParams();
    if(month) params.set('month', month);
    if(clientId) params.set('clientId', clientId);
    const url = `/api/projects?${params.toString()}`;
    const data = await fetch(url).then(r=>r.json());
    setProjects(data||[]);
    setLoading(false);
  }

  useEffect(()=>{ load(); },[month, clientId]);

  const sumTotal = useMemo(()=> projects.reduce((s,p)=>s+(p.total||0),0), [projects]);

  function downloadExcel(){
    const params = new URLSearchParams();
    params.set('month', month);
    if(clientId) params.set('clientId', clientId);
    window.location.href = `/api/export/excel?${params.toString()}`;
  }

  function downloadPpt(projectId: string){
    window.location.href = `/api/export/pptx?projectId=${projectId}`;
  }

  return (
    <main className="page-wrap">
      <div className="page-head">
        <h1 className="page-title">Reportes</h1>
        <div className="d-flex gap-2">
          <button className="btn-bosam" onClick={downloadExcel}>Exportar Excel</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-bosam compact mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label">Mes</label>
            <input type="month" className="form-control" value={month} onChange={e=>setMonth(e.target.value)} />
          </div>
          <div className="col-md-5">
            <label className="form-label">Cliente</label>
            <select className="form-control" value={clientId} onChange={e=>setClientId(e.target.value)}>
              <option value="">— Todos —</option>
              {clients.map(c=>(
                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 text-end">
            <div className="text-muted">Total del periodo</div>
            <div className="h4 m-0">${sumTotal.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tabla de proyectos */}
      <div className="list-card">
        <div className="d-flex justify-content-between mb-2">
          <div className="section-sub">
            {loading ? 'Cargando…' : `${projects.length} proyectos`}
          </div>
          <Link className="section-sub" href="/projects">Ir a Proyectos →</Link>
        </div>

        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Servicios</th>
                <th>Total</th>
                <th>PPT</th>
              </tr>
            </thead>
            <tbody>
              {projects.length===0 && (
                <tr><td colSpan={5} className="text-muted">Sin proyectos para el filtro seleccionado</td></tr>
              )}
              {projects.map(p=>(
                <tr key={p._id}>
                  <td>{p.clientId?.name} <span className="text-muted">({p.clientId?.code})</span></td>
                  <td>{p.date}</td>
                  <td>
                    <div className="text-truncate" style={{maxWidth:360}}>
                      {p.services?.map((s,i)=>(
                        <span key={i}>
                          {s.label}×{s.qty}{i<p.services.length-1?', ':''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>${(p.total||0).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-dark" onClick={()=>downloadPpt(p._id)}>
                      Descargar PPT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
