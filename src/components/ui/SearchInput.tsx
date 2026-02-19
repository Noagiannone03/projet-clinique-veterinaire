import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounce?: number;
    className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Rechercher...', debounce = 300, className = '' }: SearchInputProps) {
    const [localValue, setLocalValue] = useState(value);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (newValue: string) => {
        setLocalValue(newValue);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChange(newValue), debounce);
    };

    const clear = () => {
        setLocalValue('');
        onChange('');
    };

    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="text"
                value={localValue}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
            {localValue && (
                <button
                    onClick={clear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
