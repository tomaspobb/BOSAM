import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <NavBar />   {/* ✅ aparece arriba */}
        {children}
        <Footer />   {/* ✅ aparece abajo */}
      </body>
    </html>
  );
}
