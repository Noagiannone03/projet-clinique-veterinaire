import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = '', id, ...props }, ref) => {
        const textareaId = id || props.name;

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 mb-1.5">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-y ${
                        error
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-primary-500 focus:ring-primary-200'
                    } ${className}`}
                    rows={3}
                    {...props}
                />
                {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
