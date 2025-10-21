"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Client = { _id?:string; name:string; code:string };
type Project = { _id?:string; clientId:any; date:string; total:number; note?:string };

export default function Dashboard(){
  const [clients,setClients]=useState<Client[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const totalMonth = projects.reduce((s,p)=>s+(p.total||0),0);

  useEffect(()=>{ (async()=>{
    const c = await fetch("/api/clients").then(r=>r.json());
    const p = await fetch("/api/projects").then(r=>r.json());
    setClients(c); setProjects(p);
  })() },[]);

  return (
    <main className="py-4">
      {/* Header + acciones rápidas */}
      <div className="card-bosam mb-3 d-flex justify-content-between align-items-center flex-wrap">
        <h1 className="m-0 fw-bold">Panel general</h1>
        <div className="d-flex gap-2">
          <Link href="/clients"  className="btn btn-outline-dark">+ Cliente</Link>
          <Link href="/projects" className="btn-bosam">+ Proyecto</Link>
        </div>
      </div>

      {/* Métricas */}
      <div className="row g-3 mb-3">
        <div className="col-md-4"><div className="card-bosam"><div className="text-muted">Clientes</div><div className="h2 fw-bold">{clients.length}</div></div></div>
        <div className="col-md-4"><div className="card-bosam"><div className="text-muted">Proyectos</div><div className="h2 fw-bold">{projects.length}</div></div></div>
        <div className="col-md-4"><div className="card-bosam"><div className="text-muted">Total mensual</div><div className="h2 fw-bold">${totalMonth.toLocaleString()}</div></div></div>
      </div>

      {/* Actividad reciente */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card-bosam">
            <h4 className="fw-bold mb-2">Clientes registrados</h4>
            <ul className="mb-0">
              {clients.length===0 && <li className="text-muted">Aún no hay clientes</li>}
              {clients.slice(0,8).map(c=><li key={c._id}><strong>{c.name}</strong> <span className="text-muted">({c.code})</span></li>)}
            </ul>
            <div className="text-end mt-2"><Link href="/clients">Ver todos →</Link></div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card-bosam">
            <h4 className="fw-bold mb-2">Proyectos recientes</h4>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead><tr><th>Cliente</th><th>Fecha</th><th>Total</th><th>Obs</th></tr></thead>
                <tbody>
                  {projects.length===0 && <tr><td colSpan={4} className="text-muted">Sin registros</td></tr>}
                  {projects.slice(0,10).map((p:any)=>(
                    <tr key={p._id}>
                      <td>{p.clientId?.name}</td>
                      <td>{p.date}</td>
                      <td>${(p.total||0).toLocaleString()}</td>
                      <td>{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-end mt-2"><Link href="/projects">Ver todos →</Link></div>
          </div>
        </div>
      </div>
    </main>
  );
}
