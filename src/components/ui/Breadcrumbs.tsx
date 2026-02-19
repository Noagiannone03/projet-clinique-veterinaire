import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
    label: string;
    to?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Fil d'Ariane">
            <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
                <Home className="w-4 h-4" />
            </Link>
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    {item.to ? (
                        <Link to={item.to} className="text-slate-500 hover:text-slate-700 transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-slate-700 font-medium">{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}
