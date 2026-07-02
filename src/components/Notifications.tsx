/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  BellRing,
  Trash2,
  CheckCheck,
  Calendar,
  CreditCard,
  AlertCircle,
  X,
  ChevronLeft
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { AppNotification, Shop } from '../types';

interface NotificationsProps {
  shop: Shop;
  onNavigateTo: (screen: string) => void;
}

export default function Notifications({ shop, onNavigateTo }: NotificationsProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const triggerToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const loadData = () => {
    setNotifications(dbMock.getNotifications(shop.id));
  };

  useEffect(() => {
    loadData();
  }, [shop.id]);

  const handleMarkAllRead = () => {
    dbMock.markNotificationsRead(shop.id);
    triggerToast('All notifications marked read (सभी सूचनाएं पढ़ी गईं)');
    loadData();
  };

  const handleMarkSingleRead = (id: string) => {
    dbMock.markSingleNotificationRead(shop.id, id);
    loadData();
  };

  const handleDelete = (id: string) => {
    dbMock.deleteNotification(shop.id, id);
    triggerToast('Notification cleared');
    loadData();
  };

  return (
    <div className="flex flex-col min-h-[580px] bg-slate-50 relative pb-20 overflow-y-auto p-4 space-y-4">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800 animate-slide-in">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTo('home')}
            className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Notifications (सूचनाएं)</h2>
            <p className="text-xs text-slate-500">Real-time alerts & activities</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-blue-600 bg-blue-50 py-1.5 px-3 rounded-xl flex items-center gap-1 hover:bg-blue-100 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark Read
          </button>
        )}
      </div>

      {/* Lists */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No new alerts or system updates.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleMarkSingleRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all flex justify-between items-start cursor-pointer hover:shadow-xs ${
                notif.is_read
                  ? 'bg-white border-slate-200 opacity-75'
                  : 'bg-blue-50/40 border-blue-100 shadow-xs'
              }`}
            >
              <div className="flex gap-3">
                <div
                  className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                    notif.type === 'booking_new'
                      ? 'bg-blue-50 text-blue-600'
                      : notif.type === 'payment_received'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {notif.type === 'booking_new' && <Calendar className="w-4 h-4" />}
                  {notif.type === 'payment_received' && <CreditCard className="w-4 h-4" />}
                  {notif.type === 'system' && <AlertCircle className="w-4 h-4" />}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    {notif.title}
                    {!notif.is_read && (
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full inline-block" />
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                    {notif.message}
                  </p>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1.5 uppercase">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notif.id);
                }}
                className="p-1 text-slate-300 hover:text-red-500 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
