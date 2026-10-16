'use client';

import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/home" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t('profile')}</h1>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600 text-lg mb-4">
            {i18n.language === 'ar' ? 'صفحة الملف الشخصي قيد الإنشاء' : 'Profile page is under construction'}
          </p>
          <p className="text-gray-500">
            {i18n.language === 'ar' ? 'سيتم إضافة ميزات الملف الشخصي قريباً' : 'Profile features coming soon'}
          </p>
        </div>
      </div>
    </Layout>
  );
}
