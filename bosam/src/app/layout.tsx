import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Providers from './providers'; // SessionProvider para NextAuth

export const metadata = {
  title: 'Bosam',
  description: 'Sistema de gestión Bosam',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="d-flex flex-column min-vh-100">
        <Providers>
          <NavBar />     {/* ✅ Navbar fijo en todas las páginas */}
          <main className="flex-fill">{children}</main>
          <Footer />     {/* ✅ Footer al final */}
        </Providers>
      </body>
    </html>
  );
}
