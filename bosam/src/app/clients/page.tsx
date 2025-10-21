"use client";
import { useEffect, useState, FormEvent } from "react";

type Client = { _id?:string; name:string; code:string };

export default function ClientsPage(){
  const [clients,setClients]=useState<Client[]>([]);
  const [form,setForm]=useState<Client>({ name:"", code:"" });

  async function load(){ setClients(await fetch("/api/clients").then(r=>r.json())); }
  useEffect(()=>{ load(); },[]);

  async function add(e:FormEvent){
    e.preventDefault();
    const res = await fetch("/api/clients",{ method:"POST", body: JSON.stringify(form) });
    if(res.ok){ setForm({name:"", code:""}); load(); }
  }

  return (
    <main className="py-4">
      <div className="card-bosam mb-3">
        <h2 className="fw-bold m-0">Clientes</h2>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card-bosam">
            <h5 className="fw-bold mb-3">Agregar cliente</h5>
            <form onSubmit={add}>
              <label className="form-label">Nombre</label>
              <input className="form-control" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />

              <label className="form-label">Código</label>
              <input className="form-control" value={form.code} onChange={e=>setForm({...form, code:e.target.value.toUpperCase()})} required />

              <div className="d-grid mt-3"><button className="btn-bosam">Guardar</button></div>
            </form>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card-bosam">
            <h5 className="fw-bold mb-2">Listado</h5>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead><tr><th>Nombre</th><th>Código</th></tr></thead>
                <tbody>
                  {clients.length===0 && <tr><td colSpan={2} className="text-muted">Sin clientes</td></tr>}
                  {clients.map(c=>(
                    <tr key={c._id}><td>{c.name}</td><td>{c.code}</td></tr>
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
