import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RotateCcw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PowerBIErrorCardProps {
  errorMessage?: string;
  onRetry: () => void;
}

export const PowerBIErrorCard: React.FC<PowerBIErrorCardProps> = ({
  errorMessage,
  onRetry,
}) => {
  return (
    <Card className="p-8 bg-white dark:bg-[#151A2D] border border-rose-200/90 dark:border-rose-900/50 shadow-2xs text-center flex flex-col items-center justify-center min-h-[480px]">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900/50 shadow-xs">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight font-display mb-2">
        Unable to Load Power BI Report
      </h3>

      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-lg mb-4 leading-relaxed">
        The Power BI service was unable to authenticate or render the embedded report session. This may occur if the embed token expired, network connectivity failed, or Azure permissions were modified.
      </p>

      {errorMessage && (
        <div className="p-3 bg-stone-50 dark:bg-stone-900/80 rounded-xl border border-stone-200 dark:border-stone-800 max-w-md w-full mb-6 text-left">
          <p className="text-[11px] font-mono text-rose-700 dark:text-rose-400 break-words">
            {errorMessage}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={onRetry}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Retry Embedding
        </Button>

        <Link to="/analytics">
          <Button variant="outline" size="sm" className="text-stone-700 dark:text-stone-300">
            Open Native Analytics
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};
