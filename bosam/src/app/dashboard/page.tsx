"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaUsers, FaTasks, FaDollarSign } from "react-icons/fa";

type Client = { _id?:string; name:string; code:string };
type Project = { _id?:string; clientId:any; date:string; total:number; note?:string };

export default function Dashboard(){
  const [clients,setClients]=useState<Client[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const totalMonth = projects.reduce((s,p)=> s + (p.total||0), 0);

  useEffect(()=>{ (async()=>{
    const [c,p] = await Promise.all([
      fetch("/api/clients").then(r=>r.json()),
      fetch("/api/projects").then(r=>r.json()),
    ]);
    setClients(c); setProjects(p);
  })() },[]);

  return (
    <main className="py-3 page-wrap">
      {/* header */}
      <div className="card-bosam compact mb-3 section-header">
        <div>
          <h1 className="section-title">Panel general</h1>
          <div className="section-sub">Resumen de tu mes</div>
        </div>
        <div className="d-flex gap-2">
          <Link href="/clients"  className="btn btn-outline-dark">+ Cliente</Link>
          <Link href="/projects" className="btn-bosam">+ Proyecto</Link>
        </div>
      </div>

      {/* métricas */}
      <div className="stats-grid mb-3">
        <div className="card-bosam stat-card">
          <div className="stat-icon"><FaUsers /></div>
          <div>
            <div className="stat-title">Clientes</div>
            <div className="stat-value">{clients.length}</div>
          </div>
        </div>

        <div className="card-bosam stat-card">
          <div className="stat-icon"><FaTasks /></div>
          <div>
            <div className="stat-title">Proyectos</div>
            <div className="stat-value">{projects.length}</div>
          </div>
        </div>

        <div className="card-bosam stat-card">
          <div className="stat-icon"><FaDollarSign /></div>
          <div>
            <div className="stat-title">Total mensual</div>
            <div className="stat-value">${totalMonth.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* dos bloques principales */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card-bosam">
            <div className="section-header mb-2">
              <h2 className="h2 section-title">Clientes registrados</h2>
              <Link href="/clients" className="section-sub">Ver todos →</Link>
            </div>
            <ul className="mb-0">
              {clients.length===0 && <li className="text-muted">Aún no hay clientes</li>}
              {clients.slice(0,8).map(c=>(
                <li key={c._id}><strong>{c.name}</strong> <span className="text-muted">({c.code})</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card-bosam">
            <div className="section-header mb-2">
              <h2 className="h2 section-title">Proyectos recientes</h2>
              <Link href="/projects" className="section-sub">Ver todos →</Link>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr><th>Cliente</th><th>Fecha</th><th>Total</th><th>Obs</th></tr>
                </thead>
                <tbody>
                  {projects.length===0 && <tr><td colSpan={4} className="text-muted">Sin registros</td></tr>}
                  {projects.slice(0,10).map((p:any)=>(
                    <tr key={p._id}>
                      <td>{p.clientId?.name}</td>
                      <td>{p.date}</td>
                      <td>${(p.total||0).toLocaleString()}</td>
                      <td className="text-truncate" style={{maxWidth:200}}>{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
