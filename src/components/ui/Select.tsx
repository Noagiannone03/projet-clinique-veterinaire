import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
        const selectId = id || props.name;

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1.5">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                        error
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-primary-500 focus:ring-primary-200'
                    } ${className}`}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';
