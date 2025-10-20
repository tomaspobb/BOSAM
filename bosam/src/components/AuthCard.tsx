export default function AuthCard({
  title, subtitle, children
}: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="card-bosam auth-card">
        <h2 className="fw-bold mb-2">{title}</h2>
        {subtitle && <p className="text-muted mb-4">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
