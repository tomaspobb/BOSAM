"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthLanding(){
  const router = useRouter();

  useEffect(()=>{ (async()=>{
    // Si no hay usuarios creados → manda directo a registro
    const r = await fetch("/api/auth/exists");
    const { hasUsers } = await r.json();
    if (!hasUsers) router.replace("/auth/register");
  })() },[router]);

  return (
    <div className="auth-wrap">
      <div style={{maxWidth:920, width:"100%", display:"grid", gap:"1rem",
                   gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))"}}>
        <a href="/auth/login"
           className="card-bosam"
           style={{ textDecoration:"none", color:"inherit", textAlign:"center",
                    padding:"2rem", transform:"translateZ(0)" }}>
          <h3 className="fw-bold mb-2">Iniciar sesión</h3>
          <p className="text-muted">Accede con tu cuenta Bosam</p>
        </a>

        <a href="/auth/register"
           className="card-bosam"
           style={{ textDecoration:"none", color:"inherit", textAlign:"center",
                    padding:"2rem" }}>
          <h3 className="fw-bold mb-2">Crear cuenta</h3>
          <p className="text-muted">Regístrate para comenzar</p>
        </a>
      </div>
    </div>
  );
}
