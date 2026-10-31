import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, type LucideIcon } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  phase: string;
  description: string;
  icon: LucideIcon;
  apiEndpoints?: string[];
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  phase,
  description,
  icon: Icon,
  apiEndpoints = [],
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card variant="elevated" className="p-8 sm:p-12 text-center flex flex-col items-center border-stone-200">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 border border-indigo-100 shadow-sm">
          <Icon className="w-7 h-7" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="indigo" size="md">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Scheduled for {phase}
          </Badge>
        </div>

        <h2 className="text-2xl font-bold text-stone-900 mb-2 font-display">
          {title} Module Shell
        </h2>
        <p className="text-sm text-stone-600 max-w-lg mb-8 leading-relaxed">
          {description}
        </p>

        {apiEndpoints.length > 0 && (
          <div className="w-full max-w-md p-4 rounded-xl bg-stone-50 border border-stone-200/80 mb-8 text-start">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Verified Backend API Contract
            </p>
            <div className="space-y-1 font-mono text-xs text-stone-700">
              {apiEndpoints.map((ep) => (
                <div key={ep} className="px-2.5 py-1 rounded bg-white border border-stone-200/60 truncate">
                  {ep}
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Button>
        </Link>
      </Card>
    </div>
  );
};
