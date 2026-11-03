import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { PowerBIReportMeta, PowerBIReportId } from '../types/powerbi.types';
import { BarChart3, Building2, ShieldAlert } from 'lucide-react';

interface PowerBIReportSelectorProps {
  reports: PowerBIReportMeta[];
  selectedReportId: PowerBIReportId;
  onSelectReport: (id: PowerBIReportId) => void;
}

export const PowerBIReportSelector: React.FC<PowerBIReportSelectorProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Executive':
        return <BarChart3 className="w-3.5 h-3.5" />;
      case 'Department':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'Compliance':
        return <ShieldAlert className="w-3.5 h-3.5" />;
      default:
        return <BarChart3 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#151A2D] p-2 sm:p-2.5 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {reports.map((report) => {
          const isSelected = report.id === selectedReportId;
          return (
            <button
              key={report.id}
              type="button"
              onClick={() => onSelectReport(report.id)}
              className={`text-left p-3.5 rounded-xl transition-all duration-150 border flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-xs'
                  : 'bg-stone-50/60 dark:bg-stone-900/50 border-stone-200/60 dark:border-stone-800 hover:bg-stone-100/70 dark:hover:bg-stone-800/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {getCategoryIcon(report.category)}
                    <span>{report.category}</span>
                  </div>
                  <Badge
                    variant={isSelected ? 'indigo' : 'neutral'}
                    size="sm"
                    className="text-[9px] py-0 px-1"
                  >
                    {report.allowedRoles.map((r) => r.replace('_', ' ')).join(', ')}
                  </Badge>
                </div>
                <h4
                  className={`text-sm font-bold tracking-tight font-display ${
                    isSelected ? 'text-indigo-950 dark:text-indigo-100' : 'text-stone-900 dark:text-stone-100'
                  }`}
                >
                  {report.title}
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">
                  {report.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
