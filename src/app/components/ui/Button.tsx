type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
};

export function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }: ButtonProps) {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50';
  const variants = {
    primary:   'bg-brand-500 text-white hover:bg-brand-600',
    secondary: 'bg-brand-100 text-brand-700 hover:bg-brand-200',
    danger:    'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
