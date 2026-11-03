import React from 'react';
import { Card } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';

export const PowerBILoadingSkeleton: React.FC = () => {
  return (
    <Card className="p-6 bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs h-[650px] flex flex-col justify-between animate-pulse">
      {/* Top action bar skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800" />
          <div className="space-y-1.5">
            <div className="w-48 h-4 rounded-sm bg-stone-100 dark:bg-stone-800" />
            <div className="w-28 h-3 rounded-sm bg-stone-100 dark:bg-stone-800" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-7 rounded-lg bg-stone-100 dark:bg-stone-800" />
          <div className="w-20 h-7 rounded-lg bg-stone-100 dark:bg-stone-800" />
        </div>
      </div>

      {/* Main Canvas Body Skeleton */}
      <div className="flex-1 my-4 grid grid-cols-12 gap-4">
        {/* KPI Cards row */}
        <div className="col-span-12 grid grid-cols-4 gap-3 h-24">
          <div className="bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-100 dark:border-stone-800" />
          <div className="bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-100 dark:border-stone-800" />
          <div className="bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-100 dark:border-stone-800" />
          <div className="bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-100 dark:border-stone-800" />
        </div>

        {/* Chart 1 */}
        <div className="col-span-8 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-100 dark:border-stone-800 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-stone-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold">Initializing Power BI Embedded Engine...</span>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="col-span-4 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-100 dark:border-stone-800" />
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-400">
        <div className="w-32 h-3 rounded-sm bg-stone-100 dark:bg-stone-800" />
        <div className="w-24 h-3 rounded-sm bg-stone-100 dark:bg-stone-800" />
      </div>
    </Card>
  );
};
