import React from 'react';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { I18nProvider } from '@/i18n';
import { ToastProvider } from '@/components/feedback/Toast';
import { AppRouter } from '@/app/router/AppRouter';

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </I18nProvider>
  );
};

export default App;
