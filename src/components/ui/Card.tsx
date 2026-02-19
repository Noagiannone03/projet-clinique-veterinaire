interface CardProps {
    children: React.ReactNode;
    className?: string;
    hoverable?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export function Card({ children, className = '', hoverable = false, padding = 'md', onClick }: CardProps) {
    return (
        <div
            className={`rounded-2xl border border-slate-200 bg-white shadow-card ${paddingClasses[padding]} ${hoverable ? 'cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-card-hover' : ''} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}
