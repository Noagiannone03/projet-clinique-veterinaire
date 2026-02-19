import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
    label: string;
    value: string | number;
    change?: number;
    changeType?: 'increase' | 'decrease';
    icon: React.ReactNode;
    link?: string;
    className?: string;
}

export function StatsCard({ label, value, change, changeType, icon, link, className = '' }: StatsCardProps) {
    const navigate = useNavigate();

    return (
        <div
            className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
            onClick={link ? () => navigate(link) : undefined}
            role={link ? 'button' : undefined}
            tabIndex={link ? 0 : undefined}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                    {change !== undefined && changeType && (
                        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${changeType === 'increase' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {changeType === 'increase' ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span>{change > 0 ? '+' : ''}{change}%</span>
                        </div>
                    )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                    {icon}
                </div>
            </div>
        </div>
    );
}
