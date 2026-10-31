import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import { loginSchema, type LoginFormData } from './auth.schema';
import { extractApiErrors } from '@/services/api/errorExtractor';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { Card } from '@/components/ui/Card';
import { Lock, Mail, TrendingUp } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onSubmit = async (data: LoginFormData) => {
    setGeneralError(null);
    try {
      await login(data);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const extracted = extractApiErrors(err);

      // Map backend field-specific validation errors to React Hook Form
      if (Object.keys(extracted.fieldErrors).length > 0) {
        Object.entries(extracted.fieldErrors).forEach(([field, message]) => {
          if (field === 'email' || field === 'password') {
            setError(field, { type: 'server', message });
          }
        });
      }

      // Display non-field messages (e.g. Invalid credentials, Account deactivated) in alert
      if (extracted.generalErrors.length > 0) {
        setGeneralError(extracted.generalErrors.join('. '));
      } else if (Object.keys(extracted.fieldErrors).length === 0) {
        setGeneralError('Authentication failed. Please verify your credentials.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 mb-4">
          <TrendingUp className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight font-display">
          FinSight
        </h1>
        <p className="mt-1 text-sm text-stone-500 font-medium">
          {t('common.appTagline')}
        </p>
      </div>

      {/* Main Login Card */}
      <Card variant="elevated" className="sm:mx-auto sm:w-full sm:max-w-md p-8 sm:p-10 border-stone-200/80">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-stone-900 font-display">
            {t('auth.loginTitle')}
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {generalError && (
          <div className="mb-6">
            <Alert variant="danger">{generalError}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Input
            label={t('auth.emailLabel')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            autoComplete="username"
            disabled={isSubmitting}
            leadingIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label={t('auth.passwordLabel')}
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            autoComplete="current-password"
            disabled={isSubmitting}
            leadingIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-base font-semibold shadow-indigo-600/20"
              isLoading={isSubmitting}
            >
              {isSubmitting ? t('auth.signingIn') : t('auth.signInButton')}
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400">
            Internal enterprise system. Access is strictly managed by your System Administrator.
          </p>
        </div>
      </Card>

      {/* Security notice footer */}
      <div className="mt-8 text-center text-xs text-stone-400">
        &copy; {new Date().getFullYear()} FinSight Systems. All rights reserved.
      </div>
    </div>
  );
};
