// src/components/NavBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaUserFriends, FaTasks, FaChartBar, FaSignOutAlt } from 'react-icons/fa';

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (p: string) => pathname?.startsWith(p);

  // Ocultar navbar en páginas de auth
  if (pathname?.startsWith('/auth')) return null;

  async function onLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      // te llevo a /auth sí o sí aunque fallen los fetch
      window.location.href = '/auth';
    }
  }

  return (
    <nav className="navbar-bosam">
      <div className="container d-flex align-items-center justify-content-between">
        <Link href="/dashboard" className="brand">Bosam</Link>
        <div className="d-flex gap-2 align-items-center">
          <Link href="/dashboard" className={`nav-link-fgm ${isActive('/dashboard') ? 'active' : ''}`}>
            <FaHome className="me-1" />Inicio
          </Link>
          <Link href="/clients" className={`nav-link-fgm ${isActive('/clients') ? 'active' : ''}`}>
            <FaUserFriends className="me-1" />Clientes
          </Link>
          <Link href="/projects" className={`nav-link-fgm ${isActive('/projects') ? 'active' : ''}`}>
            <FaTasks className="me-1" />Proyectos
          </Link>
          <Link href="/reports" className={`nav-link-fgm ${isActive('/reports') ? 'active' : ''}`}>
            <FaChartBar className="me-1" />Reportes
          </Link>

          <button
            onClick={onLogout}
            className="btn btn-sm btn-outline-light ms-1 d-flex align-items-center"
          >
            <FaSignOutAlt className="me-1" />
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
