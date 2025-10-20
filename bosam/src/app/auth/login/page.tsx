'use client';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import AuthCard from '@/components/AuthCard';

export default function LoginPage(){
  const router = useRouter();
  const qp = useSearchParams();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [error,setError]=useState('');

  // 👉 Prefill si vienes del registro
  useEffect(()=>{
    if (qp.get('from') === 'register' && typeof window !== "undefined") {
      const e = sessionStorage.getItem('bosam_prefill_email') || '';
      const p = sessionStorage.getItem('bosam_prefill_password') || '';
      setEmail(e); setPassword(p);
    }
  },[qp]);

  async function onSubmit(e:FormEvent){
    e.preventDefault(); setError('');
    const res = await signIn('credentials',{ email,password, redirect:false });
    if(res?.ok) router.push('/dashboard'); else setError('Credenciales inválidas');
  }

  return (
    <>
      <AuthCard title="Bienvenido a Bosam" subtitle="Inicia sesión para continuar">
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
          </div>

          <div className="d-grid mt-3">
            <button className="btn-bosam" type="submit">Entrar</button>
          </div>
        </form>
      </AuthCard>

      <div className="auth-wrap" style={{paddingTop:0}}>
        <div className="switch-card">
          ¿No tienes cuenta? &nbsp;
          <a href="/auth/register" className="switch-link">Crear cuenta</a>
        </div>
      </div>
    </>
  );
}
