import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6">
      <Card variant="elevated" className="max-w-md w-full p-8 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mb-4 border border-stone-200">
          <FileQuestion className="w-7 h-7" />
        </div>
        <h1 className="text-4xl font-extrabold text-stone-900 mb-2 font-display">404</h1>
        <h2 className="text-lg font-bold text-stone-800 mb-2">
          {t('common.pageNotFoundTitle')}
        </h2>
        <p className="text-sm text-stone-600 mb-6 leading-relaxed">
          {t('common.pageNotFoundDesc')}
        </p>
        <Link to="/dashboard" className="w-full">
          <Button variant="primary" className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.goDashboard')}</span>
          </Button>
        </Link>
      </Card>
    </div>
  );
};
