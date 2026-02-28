import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | string | ((row: T) => React.ReactNode);
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (row: T) => string | number;
    onRowClick?: (row: T) => void;
    isLoading?: boolean;
}

function Table<T>({
    data,
    columns,
    keyExtractor,
    onRowClick,
    isLoading
}: TableProps<T>) {
    return (
        <div className="w-full overflow-hidden rounded-[20px] border border-gray-100 bg-white">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 text-xs uppercase text-gray-500">
                        <tr>
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    className={`px-6 py-4 font-medium tracking-wider ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {columns.map((_, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <div className="h-4 w-24 bg-gray-100 rounded"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400 text-xs">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr
                                    key={keyExtractor(row)}
                                    className={`
                                        group transition-colors hover:bg-gray-50/50
                                        ${onRowClick ? 'cursor-pointer' : ''}
                                    `}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                    {columns.map((col, index) => (
                                        <td key={index} className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">
                                            {typeof col.accessor === 'function'
                                            ? col.accessor(row)
                                            : (row as any)[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Table;
export { Table };