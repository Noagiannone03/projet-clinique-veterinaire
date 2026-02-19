interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}

export function FormField({ label, error, required, children, className = '' }: FormFieldProps) {
    return (
        <div className={`w-full ${className}`}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {label}
                {required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
        </div>
    );
}
