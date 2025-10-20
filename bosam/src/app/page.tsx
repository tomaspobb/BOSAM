"use client";
import { useEffect, useState } from "react";

type Invoice = {
  _id?: string;
  orderNumber: string;
  codigoConcesionario: string;
  codigoEmpresa: string;
  codigoServicio: string;
  fecha: string;
  costo: number | string;
  anotaciones?: string;
  blobUrl?: string;
};

export default function Page() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [conces, setConces] = useState("");

  const [f, setF] = useState<Invoice>({
    orderNumber: "", codigoConcesionario: "", codigoEmpresa: "",
    codigoServicio: "", fecha: "", costo: "", anotaciones: "", blobUrl: ""
  });

  async function load() {
    setLoading(true);
    const qs = conces ? `?conces=${encodeURIComponent(conces)}` : "";
    const res = await fetch(`/api/invoices${qs}`);
    const j = await res.json();
    setItems(j.data); setTotal(j.total); setLoading(false);
  }

  useEffect(() => { load(); }, [conces]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...f, costo: Number(f.costo || 0) };
    const res = await fetch("/api/invoices", { method:"POST", body: JSON.stringify(payload) });
    if (res.ok) {
      setF({ orderNumber:"", codigoConcesionario:"", codigoEmpresa:"", codigoServicio:"", fecha:"", costo:"", anotaciones:"", blobUrl:"" });
      load();
    }
  }

  async function del(id?: string) {
    if (!id) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    load();
  }

  const exportExcel = () => {
    const qs = conces ? `?conces=${encodeURIComponent(conces)}` : "";
    window.location.href = `/api/export${qs}`;
  };

  return (
    <main className="container py-4">
      <nav className="navbar navbar-dark rounded-3 px-3 mb-4">
        <span className="navbar-brand">Bosam</span>
        <button className="btn btn-light btn-sm" onClick={exportExcel}>Exportar a Excel</button>
      </nav>

      {/* Filtros */}
      <div className="card p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-6 col-md-3">
            <label className="form-label">Filtrar por código concesionario</label>
            <input className="form-control" value={conces} onChange={e=>setConces(e.target.value.toUpperCase())} placeholder="AS, FRZ, etc." />
          </div>
          <div className="col-auto">
            <button className="btn btn-secondary" onClick={()=>setConces("")}>Limpiar</button>
          </div>
          <div className="col text-end">
            <span className="badge bg-dark fs-6">Total: ${total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Formulario alta rápida */}
      <div className="card p-3 mb-4">
        <h5 className="mb-3">Agregar factura (manual)</h5>
        <form onSubmit={add} className="row g-2">
          <div className="col-6 col-md-3">
            <label className="form-label">N° Orden</label>
            <input className="form-control" value={f.orderNumber} onChange={e=>setF({...f, orderNumber:e.target.value})} required />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Cód. Concesionaria</label>
            <input className="form-control" value={f.codigoConcesionario} onChange={e=>setF({...f, codigoConcesionario:e.target.value.toUpperCase()})} required />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Cód. Empresa</label>
            <input className="form-control" value={f.codigoEmpresa} onChange={e=>setF({...f, codigoEmpresa:e.target.value.toUpperCase()})} required />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Cód. Servicio</label>
            <input className="form-control" value={f.codigoServicio} onChange={e=>setF({...f, codigoServicio:e.target.value.toUpperCase()})} required />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Fecha (dd/mm/aaaa)</label>
            <input className="form-control" value={f.fecha} onChange={e=>setF({...f, fecha:e.target.value})} placeholder="19/02/2025" required />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Costo</label>
            <input type="number" className="form-control" value={f.costo} onChange={e=>setF({...f, costo:e.target.value})} required />
          </div>
          <div className="col-12">
            <label className="form-label">Anotaciones</label>
            <input className="form-control" value={f.anotaciones} onChange={e=>setF({...f, anotaciones:e.target.value})} />
          </div>
          <div className="col-12 text-end">
            <button className="btn btn-bosam">Guardar</button>
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="card p-0">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>N° Orden</th><th>Conces.</th><th>Empresa</th><th>Serv.</th>
                <th>Fecha</th><th>Costo</th><th>Anotaciones</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4">Cargando…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4">Sin registros</td></tr>
              ) : items.map(it => (
                <tr key={it._id}>
                  <td>{it.orderNumber}</td>
                  <td>{it.codigoConcesionario}</td>
                  <td>{it.codigoEmpresa}</td>
                  <td>{it.codigoServicio}</td>
                  <td>{it.fecha}</td>
                  <td>${Number(it.costo||0).toLocaleString()}</td>
                  <td>{it.anotaciones}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>del(it._id)}>Borrar</button>
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
