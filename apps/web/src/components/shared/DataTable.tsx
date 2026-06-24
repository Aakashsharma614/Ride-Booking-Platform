import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends { id?: string }>({ columns, data, loading, emptyMessage = "No data found", onRowClick, className }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-gray-800 overflow-hidden", className)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                {columns.map((col) => (
                  <th key={col.key as string} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  {columns.map((col) => (
                    <td key={col.key as string} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={cn("rounded-2xl border border-gray-800 bg-gray-900/50 flex items-center justify-center py-16 text-gray-500", className)}>
        <div className="text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-gray-800 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/80">
              {columns.map((col) => (
                <th key={col.key as string} className={cn("px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {data.map((row, i) => (
              <tr
                key={(row as Record<string, string>).id ?? i}
                className={cn("bg-gray-900/30 transition-colors", onRowClick && "cursor-pointer hover:bg-gray-800/50")}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key as string} className={cn("px-4 py-3 text-sm text-gray-300 whitespace-nowrap", col.className)}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key as string] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
