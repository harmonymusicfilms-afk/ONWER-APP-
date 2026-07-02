/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  CalendarDays,
  Users,
  Clock,
  PlusCircle,
  Ban,
  QrCode,
  Bell,
  CheckCircle2,
  CalendarRange,
  Search,
  ChevronRight,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { Booking, Shop, AppNotification } from '../types';

interface DashboardProps {
  shop: Shop;
  onNavigateTo: (screen: string, extraData?: any) => void;
}

export default function Dashboard({ shop, onNavigateTo }: DashboardProps) {
  // Pull dynamic stats from mock database
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedBookingForOtp, setSelectedBookingForOtp] = useState<Booking | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({
    show: false,
    msg: '',
    type: 'success'
  });

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const loadData = () => {
    setBookings(dbMock.getBookings(shop.id));
    setNotifications(dbMock.getNotifications(shop.id));
  };

  useEffect(() => {
    loadData();
    // Refresh stats periodically
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [shop.id]);

  // Derive stats
  const todayStr = '2026-07-02'; // Consistent static "today" relative to simulated date
  const todayBookings = bookings.filter(b => b.date === todayStr);
  const pendingCount = todayBookings.filter(b => b.status === 'pending').length;
  const confirmedCount = todayBookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = todayBookings.filter(b => b.status === 'completed');

  const todayRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
  const totalActiveBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  // Handle Booking OTP Validation
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForOtp) return;

    if (enteredOtp === selectedBookingForOtp.otp_code) {
      try {
        // Update booking status to completed
        dbMock.saveBooking(shop.id, {
          id: selectedBookingForOtp.id,
          status: 'completed',
          payment_status: 'paid_online', // assumes collection
          payment_method: 'upi'
        });

        triggerToast('Booking completed successfully! (बुकिंग सफलतापूर्वक पूरी हुई!)', 'success');
        setShowOtpModal(false);
        setEnteredOtp('');
        setOtpError('');
        loadData();
      } catch (err) {
        setOtpError('System error. Please try again.');
      }
    } else {
      setOtpError('Invalid OTP Code (गलत ओटीपी कोड). Try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-[580px] bg-slate-50 relative pb-20 overflow-y-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800 animate-slide-in">
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          {toast.msg}
        </div>
      )}

      {/* Top Banner Bar */}
      <div className="bg-slate-900 text-white px-5 pt-6 pb-20 rounded-b-[24px] relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-500 rounded-full blur-3xl opacity-35" />
        <div className="absolute top-20 -left-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20" />

        <div className="flex justify-between items-center relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Live Dashboard
            </div>
            <h1 className="text-xl font-black mt-0.5">{shop.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{shop.type} • {shop.upi_id}</p>
          </div>
          <button
            onClick={() => onNavigateTo('notifications')}
            className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center relative border border-slate-700 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-200" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-900">
                {unreadNotifCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="px-4 -mt-14 relative z-20 space-y-4">
        {/* Quick Action Buttons Card */}
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-md flex justify-around items-center">
          <button
            onClick={() => onNavigateTo('booking_add')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <PlusCircle className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">Add Booking</span>
          </button>

          <button
            onClick={() => onNavigateTo('block_slot')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-11 h-11 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Ban className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">Block Slot</span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
              <QrCode className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">UPI QR Code</span>
          </button>

          <button
            onClick={() => onNavigateTo('wallet')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700">Wallet</span>
          </button>
        </div>

        {/* 2x2 Stats Bento Box */}
        <div className="grid grid-cols-2 gap-3">
          {/* Revenue */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">₹{todayRevenue}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">आज की कुल कमाई</p>
            </div>
          </div>

          {/* Active Bookings */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Tasks</span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{totalActiveBookings}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">कुल एक्टिव बुकिंग</p>
            </div>
          </div>

          {/* Today's Bookings stats summary */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Appointments</span>
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <CalendarRange className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{todayBookings.length}</h3>
              <div className="flex gap-1.5 mt-0.5">
                <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 rounded">{pendingCount} pending</span>
                <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-1.5 rounded">{confirmedCount} conf</span>
              </div>
            </div>
          </div>

          {/* Customer Base */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">{dbMock.getCustomers(shop.id).length}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">ग्राहक बेस</p>
            </div>
          </div>
        </div>

        {/* Dynamic Stylid Progress Bars for Peak Hours */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800">Peak Hours Summary (पीक आवर्स)</h3>
              <p className="text-[10px] text-slate-400">Slots distribution analysis for today</p>
            </div>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                <span>Morning (10:00 AM - 01:00 PM)</span>
                <span>60% capacity</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                <span>Afternoon (01:00 PM - 04:00 PM)</span>
                <span>40% capacity</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                <span>Evening (04:00 PM - 08:00 PM)</span>
                <span>85% capacity</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Agenda - Bookings List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Agenda ({todayBookings.length})</h3>
            <button
              onClick={() => onNavigateTo('bookings')}
              className="text-xs font-semibold text-blue-600 flex items-center gap-0.5 hover:underline"
            >
              See All
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayBookings.map(booking => (
                <div
                  key={booking.id}
                  onClick={() => onNavigateTo('booking_detail', booking)}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/60 shadow-sm flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-800">
                      <span className="text-xs font-extrabold">{booking.time_slot}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase">TODAY</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{booking.customer_name}</h4>
                      <p className="text-[10px] font-semibold text-slate-600 mt-0.5">{booking.service_name}</p>
                      <p className="text-[9px] text-slate-400">Assigned: {booking.staff_name}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-slate-900">₹{booking.price}</span>
                    </div>

                    <div className="flex gap-1.5">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBookingForOtp(booking);
                            setShowOtpModal(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-[9px] font-extrabold text-white px-2 py-1 rounded-lg flex items-center gap-0.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Complete
                        </button>
                      )}

                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          booking.status === 'completed'
                            ? 'bg-green-50 text-green-700'
                            : booking.status === 'confirmed'
                            ? 'bg-blue-50 text-blue-700'
                            : booking.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code UPI Modal Overlay */}
      {showQrModal && (
        <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm text-center relative shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Nexora QR Counter Pay</h3>
            <p className="text-xs text-slate-500 mt-1">Customers can scan this code to pay directly using any UPI App</p>

            <div className="my-5 flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <img
                src={shop.qr_code_url}
                alt="UPI Shop QR Code"
                className="w-44 h-44 rounded-md"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-[10px] text-blue-800 font-semibold mb-5">
              UPI VPA: {shop.upi_id}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-3 rounded-xl"
            >
              Close QR Scanner Screen
            </button>
          </div>
        </div>
      )}

      {/* OTP Complete Booking Modal Overlay */}
      {showOtpModal && selectedBookingForOtp && (
        <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm relative shadow-xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Smartphone className="w-5 h-5 text-blue-600" />
              Verify Completion OTP
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter the 4-digit code provided by <span className="font-semibold text-slate-800">{selectedBookingForOtp.customer_name}</span> to mark this service completed.
            </p>

            <div className="bg-amber-50 border border-amber-100 text-amber-800 p-2 text-xs rounded-xl mt-3 font-semibold text-center">
              Demo Code Hint: <span className="font-extrabold text-sm">{selectedBookingForOtp.otp_code}</span>
            </div>

            {otpError && (
              <p className="text-xs text-red-600 font-medium mt-3 bg-red-50 p-2 rounded-lg border border-red-100 text-center">
                {otpError}
              </p>
            )}

            <form onSubmit={handleVerifyOtp} className="mt-4 space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={4}
                  value={enteredOtp}
                  onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 text-center text-xl font-bold py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setEnteredOtp('');
                    setOtpError('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3 rounded-xl shadow transition-colors"
                >
                  Verify & Settle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
