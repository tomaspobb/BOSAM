'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname?.startsWith('/auth');

  if (isAuth) {
    // Auth pages: solo formulario, sin navbar/footer
    return <>{children}</>;
  }

  // Resto del sitio: layout completo
  return (
    <>
      <Navbar />
      <main className="container py-4">{children}</main>
      <Footer />
    </>
  );a
}
