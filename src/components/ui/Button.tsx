import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-navy text-white hover:bg-navy/90 focus-visible:ring-navy/40',
  secondary:
    'border border-navy text-navy bg-transparent hover:bg-navy/5 focus-visible:ring-navy/40',
  ghost:
    'text-navy bg-transparent hover:bg-navy/5 focus-visible:ring-navy/40',
};

export function Button({
  variant = 'primary',
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-md px-4 py-2
        text-sm font-medium transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-40 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${className}
      `}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
