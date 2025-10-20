import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Bosam",
  description: "Gestión de proyectos y facturación"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
