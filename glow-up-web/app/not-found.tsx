'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function NotFound() {
  const { i18n } = useTranslation();

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 text-gray-900">404</h1>
          <p className="text-2xl text-gray-600 mb-8">
            {i18n.language === 'ar' ? 'عذراً! الصفحة غير موجودة' : 'Oops! Page not found'}
          </p>
          <p className="text-gray-500 mb-8">
            {i18n.language === 'ar' ? 'قد تكون هذه الصفحة غير موجودة أو تم نقلها' : 'This page might not exist or has been moved'}
          </p>
          <Link href="/home" className="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            {i18n.language === 'ar' ? 'العودة للصفحة الرئيسية' : 'Return to Home'}
          </Link>
        </div>
      </div>
    </Layout>
  );
}
