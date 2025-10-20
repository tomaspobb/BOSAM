"use client";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok) router.push("/");
    else setErr("Credenciales inválidas");
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-5">
          <div className="card p-4">
            <h1 className="mb-3">Bosam</h1>
            <p className="text-muted">Inicia sesión</p>
            {err && <div className="alert alert-danger">{err}</div>}
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input className="form-control" value={email} onChange={(e)=>setEmail(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input type="password" className="form-control" value={password} onChange={(e)=>setPassword(e.target.value)} />
              </div>
              <button className="btn btn-bosam w-100">Entrar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
