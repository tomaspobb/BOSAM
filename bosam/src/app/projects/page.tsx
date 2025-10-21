"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProjectsPage(){
  const [projects,setProjects]=useState<any[]>([]);
  useEffect(()=>{ (async()=>setProjects(await fetch("/api/projects").then(r=>r.json())))() },[]);

  return (
    <main className="py-4">
      <div className="card-bosam mb-3 d-flex justify-content-between align-items-center">
        <h2 className="fw-bold m-0">Proyectos</h2>
        <Link href="/projects/new" className="btn-bosam">+ Nuevo</Link>
      </div>

      <div className="card-bosam">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Cliente</th><th>Fecha</th><th>Total</th><th>Obs</th></tr></thead>
            <tbody>
              {projects.length===0 && <tr><td colSpan={4} className="text-muted">Sin proyectos</td></tr>}
              {projects.map((p:any)=>(
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
      </div>
    </main>
  );
}
