import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation('errors');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="text-6xl mb-4">🗺️</div>
          <h1 className="text-9xl font-bold text-gray-300">{t('error_404')}</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">{t('page_not_found')}</h2>
          <p className="mt-2 text-gray-600">{t('page_not_found_message')}</p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="w-full flex justify-center py-3 px-6 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            {t('go_home')}
          </Link>
        </div>
      </div>
    </div>
  );
};
