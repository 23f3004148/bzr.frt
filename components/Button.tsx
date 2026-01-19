import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'accent' | 'ghost';
  fullWidth?: boolean;
}

/**
 * Minimal, premium button system (monochrome + accents).
 * - No loud gradients
 * - Crisp borders
 * - Subtle motion
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 ' +
    'focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))] ' +
    'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-black text-white shadow-sm hover:shadow-md hover:-translate-y-[1px] border border-black',
    secondary:
      'bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-[1px]',
    accent:
      'bg-[rgb(var(--accent-rgb))] text-white border border-[rgba(0,0,0,0.08)] shadow-sm hover:shadow-md hover:-translate-y-[1px]',
    success:
      'bg-emerald-600 text-white border border-emerald-700/20 shadow-sm hover:shadow-md hover:-translate-y-[1px]',
    danger:
      'bg-red-600 text-white border border-red-700/20 shadow-sm hover:shadow-md hover:-translate-y-[1px]',
    ghost: 'bg-transparent text-slate-900 border border-transparent hover:bg-black/5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
