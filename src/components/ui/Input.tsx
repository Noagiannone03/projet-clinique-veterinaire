import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = '', id, ...props }, ref) => {
        const inputId = id || props.name;

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                            error
                                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                                : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                        } ${icon ? 'pl-10' : ''} ${className}`}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
