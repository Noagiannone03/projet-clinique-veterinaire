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
            className={`bg-white rounded-xl border border-slate-200 shadow-sm ${paddingClasses[padding]} ${hoverable ? 'transition-shadow hover:shadow-md cursor-pointer' : ''} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}
