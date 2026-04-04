export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-brand-800 mb-2">{children}</h3>;
}

export function CardValue({ children }: { children: React.ReactNode }) {
  return <p className="text-2xl font-bold text-brand-900">{children}</p>;
}
