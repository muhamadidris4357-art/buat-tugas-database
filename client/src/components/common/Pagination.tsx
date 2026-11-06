import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pagesToShow = 3;
  const start = Math.max(1, page - pagesToShow);
  const end = Math.min(totalPages, page + pagesToShow);

  return (
    <div
      className={cn('flex items-center justify-between mt-6 px-6 py-3 bg-gray-900/50 border-t border-gray-700 rounded-b-xl', className)}
    >
      <div className="text-sm text-gray-400">
        Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} dari {total} data
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
        </button>
        {start > 1 && (
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            1
          </button>
        )}
        {start > 2 && <span className="px-2 text-xs text-gray-500">…</span>}
        {[...Array(end - start + 1)].map((_, i) => {
          const p = start + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                p === page ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'
              )}
            >
              {p}
            </button>
          );
        })}
        {end < totalPages - 1 && <span className="px-2 text-xs text-gray-500">…</span>}
        {end < totalPages && (
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            {totalPages}
          </button>
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          Berikutnya <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
