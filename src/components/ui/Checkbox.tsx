import { forwardRef, type InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, className = '', id, ...props }, ref) => {
        const checkboxId = id || props.name;

        return (
            <label htmlFor={checkboxId} className={`flex items-center gap-2 cursor-pointer ${className}`}>
                <input
                    ref={ref}
                    type="checkbox"
                    id={checkboxId}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    {...props}
                />
                <span className="text-sm text-slate-700">{label}</span>
            </label>
        );
    }
);

Checkbox.displayName = 'Checkbox';
