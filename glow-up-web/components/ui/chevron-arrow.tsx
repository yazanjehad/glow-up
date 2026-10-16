'use client';

import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ChevronArrow() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return isRTL ? <ChevronLeft /> : <ChevronRight />;
}