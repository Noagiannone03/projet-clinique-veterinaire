import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Pagination } from './Pagination';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string;
    pageSize?: number;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    keyExtractor,
    pageSize = 20,
    onRowClick,
    emptyMessage = 'Aucune donnee',
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDirection>(null);
    const [page, setPage] = useState(1);

    const sorted = useMemo(() => {
        if (!sortKey || !sortDir) return data;
        return [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            const cmp = String(aVal).localeCompare(String(bVal), 'fr', { numeric: true });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
            if (sortDir === 'desc') setSortKey(null);
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
        setPage(1);
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortKey !== columnKey) return <ChevronsUpDown className="w-4 h-4 text-slate-300" />;
        if (sortDir === 'asc') return <ChevronUp className="w-4 h-4 text-primary-600" />;
        return <ChevronDown className="w-4 h-4 text-primary-600" />;
    };

    if (data.length === 0) {
        return <p className="text-center text-slate-500 py-12">{emptyMessage}</p>;
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`text-left py-3 px-4 font-medium text-slate-600 ${col.sortable ? 'cursor-pointer select-none hover:text-slate-900' : ''} ${col.className || ''}`}
                                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && <SortIcon columnKey={col.key} />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                className={`border-b border-slate-100 ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                                onClick={onRowClick ? () => onRowClick(item) : undefined}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className={`py-3 px-4 ${col.className || ''}`}>
                                        {col.render ? col.render(item) : String(item[col.key] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="mt-4">
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}
        </div>
    );
}
