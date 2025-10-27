'use client';
import { useEffect, useState } from 'react';

type Client = { _id: string; name: string; code: string };

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  async function load() {
    const list = await fetch('/api/clients').then(r => r.json());
    setClients(list);
  }

  async function add() {
    if (!name || !code) return alert('Completa nombre y código');
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code }),
    });
    setName(''); setCode('');
    load();
  }

  async function remove(id: string) {
    if (!confirm('¿Seguro que deseas borrar este cliente?')) return;
    await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="container py-4">
      <h1 className="fw-bold display-5 m-0">Clientes</h1>

      <div className="d-flex gap-2 mb-3">
        <input className="form-control" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
        <input className="form-control" placeholder="Código" value={code} onChange={e => setCode(e.target.value)} />
        <button className="btn btn-bosam" onClick={add}>Agregar</button>
      </div>

      <table className="table">
        <thead>
          <tr><th>Nombre</th><th>Código</th><th></th></tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.code}</td>
              <td>
                <button className="btn btn-sm btn-outline-danger" onClick={() => remove(c._id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {clients.length === 0 && <tr><td colSpan={3} className="text-muted">Sin clientes registrados</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
