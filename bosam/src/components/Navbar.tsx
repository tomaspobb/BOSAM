'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { FaHome, FaUserFriends, FaTasks, FaChartBar, FaSignOutAlt } from "react-icons/fa";

export default function Navbar(){
  const pathname = usePathname();
  const isActive = (p:string)=> pathname?.startsWith(p);

  return (
    <nav className="navbar-bosam">
      <div className="container d-flex align-items-center justify-content-between">
        <Link href="/dashboard" className="brand">Bosam</Link>
        <div className="d-flex gap-2 align-items-center">
          <Link href="/dashboard" className={`nav-link-fgm ${isActive('/dashboard')?'active':''}`}><FaHome className="me-1" />Inicio</Link>
          <Link href="/clients"   className={`nav-link-fgm ${isActive('/clients')?'active':''}`}><FaUserFriends className="me-1" />Clientes</Link>
          <Link href="/projects"  className={`nav-link-fgm ${isActive('/projects')?'active':''}`}><FaTasks className="me-1" />Proyectos</Link>
          <Link href="/reports"   className={`nav-link-fgm ${isActive('/reports')?'active':''}`}><FaChartBar className="me-1" />Reportes</Link>
          <button className="btn btn-sm btn-outline-light ms-1 d-flex align-items-center"
                  onClick={()=>signOut({ callbackUrl:'/auth' })}>
            <FaSignOutAlt className="me-1" />Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
