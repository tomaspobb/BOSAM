"use client";
import { useEffect, useState } from "react";
import NuevoProyectoButton from "@/components/NuevoProyectoButton";

export default function ProjectsPage(){
  const [projects,setProjects]=useState<any[]>([]);
  const load = async ()=> setProjects(await fetch("/api/projects").then(r=>r.json()));
  useEffect(()=>{ load(); },[]);

return (
  <main className="page-wrap">
    <div className="page-head">
      <h1 className="page-title">Proyectos</h1>
      <NuevoProyectoButton onCreated={load}/>
    </div>

    <div className="list-card">
      <div className="table-responsive">
        <table className="table mb-0">
          <thead>
            <tr><th>Cliente</th><th>Fecha</th><th>Total</th><th>Obs</th></tr>
          </thead>
          <tbody>
            {projects.length===0 && (
              <tr>
                <td colSpan={4}>
                  <div className="empty">Aún no hay proyectos. Crea el primero con “+ Nuevo”.</div>
                </td>
              </tr>
            )}
            {projects.map((p:any)=>(
              <tr key={p._id}>
                <td>{p.clientId?.name}</td>
                <td>{p.date}</td>
                <td>${(p.total||0).toLocaleString()}</td>
                <td className="text-truncate" style={{maxWidth:280}}>{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </main>
)}
