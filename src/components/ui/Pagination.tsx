import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    const pages = getVisiblePages(page, totalPages);

    return (
        <div className="flex items-center justify-center gap-1">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                aria-label="Page precedente"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            {pages.map((p, i) =>
                p === '...' ? (
                    <span key={`dots-${i}`} className="px-2 text-slate-400">...</span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPageChange(p as number)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            p === page
                                ? 'bg-primary-600 text-white'
                                : 'hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                        {p}
                    </button>
                )
            )}
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                aria-label="Page suivante"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

function getVisiblePages(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
}
