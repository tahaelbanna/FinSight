import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import type { PaginationMeta } from '@/types/api.types';

export interface PaginationProps {
  meta?: PaginationMeta;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  meta,
  currentPage,
  onPageChange,
  isLoading = false,
}) => {
  if (!meta || meta.totalPages <= 1) return null;

  const totalPages = meta.totalPages || 1;
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200/70 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
      <div>
        Showing page <span className="font-semibold text-stone-800 dark:text-stone-200">{currentPage}</span> of{' '}
        <span className="font-semibold text-stone-800 dark:text-stone-200">{totalPages}</span> ({meta.total} total entries)
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevious || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          className="gap-1 h-8 px-2.5"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </Button>

        <span className="px-3 py-1 font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 rounded-lg">
          {currentPage}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          className="gap-1 h-8 px-2.5"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
