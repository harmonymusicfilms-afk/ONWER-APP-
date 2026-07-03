/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Bell, 
  CheckCircle2, 
  Calendar, 
  IndianRupee, 
  Ban, 
  Star, 
  MessageSquare,
  Clock,
  Trash2,
  BellRing
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { Shop, AppNotification } from '../types';

interface NotificationsProps {
  shop: Shop;
  onNavigateTo: (screen: string) => void;
}

export default function Notifications({ shop, onNavigateTo }: NotificationsProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadData = () => {
    setNotifications(dbMock.getNotifications(shop.id).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  };

  useEffect(() => {
    loadData();
  }, [shop.id]);

  const handleMarkAllRead = () => {
    dbMock.markAllNotificationsRead(shop.id);
    loadData();
  };

  const handleDelete = (id: string) => {
    dbMock.deleteNotification(shop.id, id);
    loadData();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_booking': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'payment_received': return <IndianRupee className="w-4 h-4 text-emerald-600" />;
      case 'booking_cancelled': return <Ban className="w-4 h-4 text-red-600" />;
      case 'settlement': return <CheckCircle2 className="w-4 h-4 text-purple-600" />;
      case 'review': return <Star className="w-4 h-4 text-amber-600" />;
      default: return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'new_booking': return 'bg-blue-50';
      case 'payment_received': return 'bg-emerald-50';
      case 'booking_cancelled': return 'bg-red-50';
      case 'settlement': return 'bg-purple-50';
      case 'review': return 'bg-amber-50';
      default: return 'bg-slate-50';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigateTo('home')}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-[#2563EB] rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A]">Notifications</h2>
          </div>
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <BellRing className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-sm font-bold text-slate-400">All caught up!</h3>
            <p className="text-[10px] text-slate-300 mt-1">No new notifications for your shop</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.03 }}
                className={`group relative bg-white p-4 rounded-2xl border transition-all ${
                  notif.is_read ? 'border-[#E2E8F0] opacity-75' : 'border-[#2563EB]/20 shadow-sm'
                }`}
              >
                {!notif.is_read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-[#2563EB] rounded-full" />
                )}
                
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${getBgColor(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 pr-6">
                    <h4 className={`text-xs font-bold leading-tight ${notif.is_read ? 'text-slate-600' : 'text-[#0F172A]'}`}>
                      {notif.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[9px] font-bold text-slate-300">•</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDelete(notif.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all absolute right-2 bottom-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
