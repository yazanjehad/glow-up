'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  NotificationsService,
  Notification,
} from '@/integration/services/notifications/notifications.service';

type DashboardType = 'customer' | 'provider' | 'superadmin' | 'employee';

interface NotificationDropdownProps {
  notifCount: number;
  onCountUpdate: () => void;
  className?: string;
  dashboardType?: DashboardType;
}

const getNotificationRoute = (notification: Notification, dashboardType: DashboardType = 'customer'): string => {
  const { type } = notification;
  const typeLower = type?.toLowerCase() || '';

  // Define base paths for each dashboard type
  const routes = {
    customer: { booking: '/my-booking', chat: '/chat', home: '/' },
    provider: { booking: '/admin-dashboard/orders', chat: '/admin-dashboard/chat', home: '/admin-dashboard' },
    superadmin: { booking: '/super-admin-dashboard/bookings', chat: '/super-admin-dashboard/chat', home: '/super-admin-dashboard' },
    employee: { booking: '/admin-dashboard/orders', chat: '/admin-dashboard/chat', home: '/admin-dashboard' },
  };

  const baseRoutes = routes[dashboardType];

  // Handle appointment/booking types
  if (
    typeLower === 'booking' ||
    typeLower === 'appointment' ||
    typeLower === 'new_booking' ||
    typeLower === 'booking_confirmed' ||
    typeLower === 'booking_cancelled' ||
    typeLower === 'booking_completed' ||
    typeLower === 'order'
  ) {
    return baseRoutes.booking;
  }

  // Handle chat/message types - just open chat without specific ID
  if (
    typeLower === 'chat' ||
    typeLower === 'message' ||
    typeLower === 'new_message'
  ) {
    return baseRoutes.chat;
  }

  return baseRoutes.home;
};

export default function NotificationDropdown({
  notifCount,
  onCountUpdate,
  className = '',
  dashboardType = 'customer',
}: NotificationDropdownProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language?.startsWith('ar');

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await NotificationsService.getNotifications();
      setNotifications(res.data?.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (notification.status?.toLowerCase() !== 'read') {
        await NotificationsService.readNotification(notification.id);
        onCountUpdate();
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, status: 'READ' } : n
          )
        );
      }
      setIsOpen(false);
      const route = getNotificationRoute(notification, dashboardType);
      router.push(route);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationsService.readAllNotifications();
      onCountUpdate();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ' }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTime = (dateString: string) => {
    // Ensure appending 'Z' if missing so it's parsed as UTC
    const dateToParse = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    const date = new Date(dateToParse);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) return t('notifications.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notifications.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notifications.daysAgo', { count: diffDays });

    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };


  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative grid place-items-center h-9 w-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        aria-label={t('header.notifications')}
      >
        <Bell className="h-4 w-4 text-gray-700" />
        {notifCount > 0 && (
          <span className="absolute -top-1 -left-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {notifCount > 99 ? '99+' : notifCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`absolute z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] max-h-[480px] rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden ${isRTL ? 'left-0' : 'right-0'
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-base font-semibold text-gray-900">
              {t('notifications.title')}
            </h3>
            {notifCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 text-xs font-medium text-[#79A66B] hover:text-[#6B975D] transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                {t('notifications.markAllAsRead')}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[380px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#79A66B] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">{t('notifications.empty')}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-start hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${notification.status?.toLowerCase() !== 'read' ? 'bg-[#F0F7EE]' : ''
                    }`}
                >
                  {/* Unread indicator */}
                  <div className="mt-1.5 flex-shrink-0">
                    {notification.status?.toLowerCase() !== 'read' ? (
                      <span className="block h-2.5 w-2.5 rounded-full bg-[#79A66B]" />
                    ) : (
                      <span className="block h-2.5 w-2.5 rounded-full bg-gray-200" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${notification.status?.toLowerCase() !== 'read'
                          ? 'font-semibold text-gray-900'
                          : 'font-medium text-gray-700'
                        }`}
                    >
                      {t(`notifications.titles.${notification.title}`, notification.title)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Read indicator */}
                  {notification.status?.toLowerCase() === 'read' && (
                    <Check className="h-4 w-4 text-gray-300 flex-shrink-0 mt-1" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
