'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/AuthCard';

export default function RegisterPage(){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const router = useRouter();

  async function onSubmit(e:FormEvent){
    e.preventDefault(); setError('');
    const res = await fetch('/api/auth/register',{
      method:'POST',
      body: JSON.stringify({ name,email,password })
    });
    const j = await res.json();
    if(!res.ok){ setError(j.error || 'Error al registrar'); return; }

    // 👉 Prefill para el login
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bosam_prefill_email", email);
      sessionStorage.setItem("bosam_prefill_password", password);
    }
    router.push('/auth/login?from=register');
  }

  return (
    <>
      <AuthCard title="Crear cuenta" subtitle="Configura tu acceso a Bosam">
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-control" value={name} onChange={e=>setName(e.target.value)} required/>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
          </div>

          <div className="d-grid mt-3">
            <button className="btn-bosam" type="submit">Registrarme</button>
          </div>
        </form>
      </AuthCard>

      <div className="auth-wrap" style={{paddingTop:0}}>
        <div className="switch-card">
          ¿Ya tienes cuenta? &nbsp;
          <a href="/auth/login" className="switch-link">Iniciar sesión</a>
        </div>
      </div>
    </>
  );
}
