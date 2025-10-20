'use client';

export default function Navbar() {
  return (
    <nav className="navbar-bosam d-flex justify-content-between align-items-center">
      <a href="/" className="brand">Bosam</a>
      <div className="d-flex gap-3">
        <a href="/auth/login">Iniciar sesión</a>
        <a href="/auth/register">Registrarse</a>
      </div>
    </nav>
  );
}
