import { Button } from './Button';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>}
            {actionLabel && onAction && (
                <Button onClick={onAction}>{actionLabel}</Button>
            )}
        </div>
    );
}
