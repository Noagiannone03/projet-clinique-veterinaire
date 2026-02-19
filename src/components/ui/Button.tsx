import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
    primary: 'bg-primary-600 text-white shadow-sm shadow-primary-600/25 hover:bg-primary-700 focus:ring-primary-300',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus:ring-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
    danger: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700 focus:ring-rose-300',
};

const sizeClasses: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
                {...props}
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
