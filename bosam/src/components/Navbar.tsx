'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { FiHome, FiUsers, FiFolder, FiBarChart2, FiLogOut } from "react-icons/fi";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Inicio", icon: <FiHome size={18}/> },
  { href: "/clients",   label: "Clientes", icon: <FiUsers size={18}/> },
  { href: "/projects",  label: "Proyectos", icon: <FiFolder size={18}/> },
  { href: "/reports",   label: "Reportes", icon: <FiBarChart2 size={18}/> },
];

export default function Navbar(){
  const pathname = usePathname();
  const [loadingLogout, setLoadingLogout] = useState(false);

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <nav className="navbar-bosam">
      <div className="container d-flex align-items-center justify-content-between">
        <Link href="/dashboard" className="brand text-decoration-none">Bosam</Link>

        <div className="d-flex align-items-center gap-2">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`btn btn-link text-decoration-none px-3 py-2 rounded-3 ${isActive(item.href) ? "nav-active" : "nav-muted"}`}
            >
              <span className="me-2 align-middle">{item.icon}</span>
              <span className="fw-bold">{item.label}</span>
            </Link>
          ))}

          <button
            className="btn btn-bosam ms-2 d-flex align-items-center gap-2"
            onClick={async () => {
              setLoadingLogout(true);
              await signOut({ callbackUrl: "/auth" });
            }}
            disabled={loadingLogout}
            title="Cerrar sesión"
          >
            <FiLogOut size={18}/> {loadingLogout ? "Saliendo..." : "Salir"}
          </button>
        </div>
      </div>
    </nav>
  );
}
