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
  Smartphone,
  Plus,
  Share2,
  Wallet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dbMock } from '../lib/dbMock';
import { Booking, Shop, AppNotification, Service, Staff, Owner, BlockedSlot, SalonWallet } from '../types';

interface DashboardProps {
  shop: Shop;
  owner?: Owner | null;
  onNavigateTo: (screen: string, extraData?: any) => void;
}

export default function Dashboard({ shop, owner, onNavigateTo }: DashboardProps) {
  // Pull dynamic stats from mock database
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [wallet, setWallet] = useState<SalonWallet | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedBookingForOtp, setSelectedBookingForOtp] = useState<Booking | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Quick Add Booking Form States
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [qaCustomerName, setQaCustomerName] = useState('');
  const [qaCustomerPhone, setQaCustomerPhone] = useState('');
  const [qaServiceId, setQaServiceId] = useState('');
  const [qaStaffId, setQaStaffId] = useState('');
  const [qaDate, setQaDate] = useState('2026-07-02'); // Defaults to today in demo date
  const [qaTimeSlot, setQaTimeSlot] = useState('11:00');
  const [qaPaymentMethod, setQaPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [qaNotes, setQaNotes] = useState('');
  const [qaError, setQaError] = useState('');

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
    setServices(dbMock.getServices(shop.id));
    setStaff(dbMock.getStaff(shop.id));
    setBlockedSlots(dbMock.getBlockedSlots(shop.id));
    setWallet(dbMock.getWallet(shop.id));
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
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const completedTodayCount = todayBookings.filter(b => b.status === 'completed').length;
  const todayRevenue = todayBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.price, 0);
  const qrPaymentsToday = todayBookings.filter(b => b.status === 'completed' && b.payment_method === 'upi').reduce((sum, b) => sum + b.price, 0);

  const walletBalance = wallet?.pending_settlement || 0;

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  // Booking Trends Calculation
  const getBookingTrends = () => {
    const hourlyCounts = Array(12).fill(0).map((_, i) => ({ name: `${i + 9}:00`, count: 0 })); // 9 AM to 8 PM
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyCounts = days.map(day => ({ name: day, count: 0 }));

    bookings.forEach(booking => {
      // Hourly
      const timeMatch = booking.time_slot.match(/(\d+):\d+\s*(AM|PM)/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const ampm = timeMatch[2].toUpperCase();
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        
        if (hour >= 9 && hour <= 20) {
          const index = hour - 9;
          hourlyCounts[index].count++;
        }
      }

      // Daily
      const date = new Date(booking.date);
      if (!isNaN(date.getTime())) {
        dailyCounts[date.getDay()].count++;
      }
    });
    return { hourlyCounts, dailyCounts };
  };

  const { hourlyCounts, dailyCounts } = getBookingTrends();


  const getAvailableTimeSlots = () => {
    const slots = [
      "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
    ];
    
    return slots.filter(slot => {
      return !blockedSlots.some(block => {
        if (block.is_active === false) return false;
        if (block.date !== qaDate) return false;
        if (block.staff_id !== 'all' && block.staff_id !== qaStaffId) return false;
        return slot >= block.start_time && slot < block.end_time;
      });
    });
  };
  const availableTimeSlots = getAvailableTimeSlots();

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

  // Handle Quick Add Booking Form submission
  const handleQuickAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaCustomerName.trim() || !qaCustomerPhone.trim() || !qaServiceId || !qaStaffId) {
      setQaError('Please fill in all required fields (सभी आवश्यक फ़ील्ड भरें)');
      return;
    }
    setQaError('');

    try {
      const selectedService = services.find(s => s.id === qaServiceId);
      const selectedStaffMember = staff.find(s => s.id === qaStaffId);

      if (!selectedService || !selectedStaffMember) {
        setQaError('Invalid service or staff member selected.');
        return;
      }

      dbMock.saveBooking(shop.id, {
        customer_name: qaCustomerName.trim(),
        customer_phone: qaCustomerPhone.trim(),
        service_id: qaServiceId,
        service_name: selectedService.name,
        price: selectedService.price,
        staff_id: qaStaffId,
        staff_name: selectedStaffMember.name,
        date: qaDate,
        time_slot: qaTimeSlot,
        status: 'confirmed',
        payment_status: qaPaymentMethod === 'upi' ? 'paid_online' : 'unpaid',
        payment_method: qaPaymentMethod,
        notes: qaNotes.trim()
      });

      triggerToast('Appointment added successfully! (बुकिंग जोड़ दी गई है!)', 'success');

      // Reset Form fields
      setQaCustomerName('');
      setQaCustomerPhone('');
      setQaServiceId('');
      setQaStaffId('');
      setQaNotes('');
      setQaPaymentMethod('cash');
      setQaDate('2026-07-02');
      setQaTimeSlot('11:00');
      setShowQuickAddModal(false);

      // Reload data
      loadData();
    } catch (err) {
      setQaError('Failed to save appointment. Please try again.');
    }
  };

  const handleConfirmBooking = (bookingId: string) => {
    try {
      dbMock.saveBooking(shop.id, { id: bookingId, status: 'confirmed' });
      triggerToast('Booking confirmed successfully! (बुकिंग स्वीकार कर ली गई है!)', 'success');
      loadData();
    } catch (err) {
      triggerToast('Failed to confirm booking.', 'error');
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    try {
      dbMock.saveBooking(shop.id, { id: bookingId, status: 'cancelled' });
      triggerToast('Booking cancelled successfully! (बुकिंग रद्द कर दी गई है!)', 'success');
      loadData();
    } catch (err) {
      triggerToast('Failed to cancel booking.', 'error');
    }
  };

  const handleShareLink = () => {
    const shareUrl = `https://nexora.in/shop/${shop.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        triggerToast('Shop Link copied to clipboard! (दुकान का लिंक कॉपी हो गया है!)', 'success');
      }).catch(() => {
        triggerToast('Failed to copy link.', 'error');
      });
    } else {
      triggerToast('Link copied to clipboard! (दुकान का लिंक कॉपी हो गया है!)', 'success');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800 animate-slide-in">
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          {toast.msg}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-[#E2E8F0] relative z-10 shrink-0 flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">{`${
              new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'
            }, ${owner?.name || 'Sanjeev Kumar'}`}</h1>
            <p className="text-xs text-[#64748B] font-medium">{shop.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTo('notifications')}
              className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center relative border border-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-[#64748B]" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
              )}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-[#64748B] font-semibold mt-0.5 uppercase tracking-wider">
          {new Date('2026-07-02').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Scrollable Main Content Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 relative z-20 space-y-5 pb-28">
        
        {/* KPI Cards Grid (Exactly 6) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Today Bookings */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col justify-between min-h-[96px] hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Today Bookings</span>
              <div className="p-1.5 bg-blue-50 text-[#2563EB] rounded-lg">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-[#0F172A]">{todayBookings.length}</h3>
              <p className="text-[9px] text-[#64748B] mt-0.5">आज की कुल बुकिंग</p>
            </div>
          </div>

          {/* Pending Bookings */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col justify-between min-h-[96px] hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Pending Bookings</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-[#0F172A]">{pendingCount}</h3>
              <p className="text-[9px] text-[#64748B] mt-0.5">स्वीकृति का इंतज़ार</p>
            </div>
          </div>

          {/* Completed Today */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col justify-between min-h-[96px] hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Completed Today</span>
              <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-[#0F172A]">{completedTodayCount}</h3>
              <p className="text-[9px] text-[#64748B] mt-0.5">आज पूरी हुई बुकिंग</p>
            </div>
          </div>

          {/* Today Revenue */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col justify-between min-h-[96px] hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Today Revenue</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-[#0F172A]">₹{todayRevenue}</h3>
              <p className="text-[9px] text-[#64748B] mt-0.5">आज की कुल कमाई</p>
            </div>
          </div>

          {/* QR Payments Today */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col justify-between min-h-[96px] hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">QR Payments Today</span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-extrabold text-[#0F172A]">₹{qrPaymentsToday}</h3>
              <p className="text-[9px] text-[#64748B] mt-0.5">ऑनलाइन क्यूआर प्राप्त</p>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="bg-gradient-to-br from-[#2563EB] to-blue-700 text-white rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[96px] hover:shadow-md transition-shadow relative overflow-hidden col-span-2 md:col-span-1">
            <div className="flex justify-between items-center z-10">
              <span className="text-[10px] font-bold opacity-90 uppercase tracking-wider">Wallet Balance</span>
              <div className="p-1.5 bg-white/20 text-white rounded-lg">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 z-10 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-black">₹{walletBalance}</h3>
                <p className="text-[9px] opacity-80 mt-0.5">निकासी योग्य राशि</p>
              </div>
              <button
                onClick={() => onNavigateTo('wallet')}
                className="bg-white hover:bg-slate-50 text-[#2563EB] text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition-colors uppercase tracking-wider shrink-0"
              >
                Withdraw
              </button>
            </div>
            <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>

        {/* Quick Actions (Exactly 4) */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#E2E8F0] shadow-xs">
          <h3 className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-3 px-1">Quick Actions (त्वरित कार्रवाई)</h3>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => {
                setQaError('');
                setShowQuickAddModal(true);
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-2xl flex items-center justify-center border border-blue-100 shadow-2xs transition-colors">
                <PlusCircle className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-bold text-[#0F172A] text-center line-clamp-1">Add Booking</span>
            </button>

            <button
              onClick={() => onNavigateTo('block_slot')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl flex items-center justify-center border border-red-100 shadow-2xs transition-colors">
                <Ban className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-bold text-[#0F172A] text-center line-clamp-1">Block Slot</span>
            </button>

            <button
              onClick={() => onNavigateTo('customers')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-2xs transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-bold text-[#0F172A] text-center line-clamp-1">View Customers</span>
            </button>

            <button
              onClick={handleShareLink}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 shadow-2xs transition-colors">
                <Share2 className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-bold text-[#0F172A] text-center line-clamp-1">Share Shop Link</span>
            </button>
          </div>
        </div>


        {/* Booking Trends */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs space-y-4">
          <h3 className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Booking Trends (बुकिंग रुझान)</h3>
          
          <div>
            <h4 className="text-xs font-semibold text-[#0F172A] mb-2">By Hour</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#F8FAFC' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#0F172A] mb-2 mt-4">By Day of Week</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#F8FAFC' }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SECTION 1: Today's Schedule */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#2563EB] rounded-full inline-block" />
              Today's Schedule (आज का शेड्यूल)
            </h3>
            <button
              onClick={() => onNavigateTo('bookings')}
              className="text-[11px] font-bold text-[#2563EB] hover:underline flex items-center gap-0.5"
            >
              See All
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayBookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayBookings
                .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
                .map(booking => (
                  <div
                    key={booking.id}
                    onClick={() => onNavigateTo('booking_detail', booking)}
                    className="bg-white rounded-2xl p-3.5 border border-[#E2E8F0] shadow-xs flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 shrink-0">
                        <span className="text-xs font-extrabold text-[#0F172A]">{booking.time_slot}</span>
                        <span className="text-[8px] text-[#64748B] font-bold uppercase mt-0.5">TODAY</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">{booking.customer_name}</h4>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                          {booking.service_name} • {booking.staff_name}
                        </p>
                        <p className="text-[9px] text-[#64748B]">{booking.customer_phone}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-black text-[#0F172A]">₹{booking.price}</span>
                      <div className="flex items-center gap-1.5">
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBookingForOtp(booking);
                              setShowOtpModal(true);
                            }}
                            className="bg-[#2563EB] hover:bg-blue-700 text-[9px] font-extrabold text-white px-2 py-1 rounded-lg flex items-center gap-0.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Complete
                          </button>
                        )}
                        <span
                          className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            booking.status === 'completed'
                              ? 'bg-green-50 text-green-700'
                              : booking.status === 'confirmed'
                              ? 'bg-blue-50 text-[#2563EB]'
                              : booking.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : booking.status === 'no_show'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {booking.status === 'no_show' ? 'no show' : booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Pending Confirmations */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-amber-500 rounded-full inline-block" />
              Pending Confirmations (लंबित स्वीकृतियां)
            </h3>
            {bookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {bookings.filter(b => b.status === 'pending').length} Action Required
              </span>
            )}
          </div>

          {bookings.filter(b => b.status === 'pending').length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs text-center">
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">All caught up! No pending confirmations.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {bookings
                .filter(b => b.status === 'pending')
                .slice(0, 3)
                .map(booking => (
                  <div
                    key={booking.id}
                    onClick={() => onNavigateTo('booking_detail', booking)}
                    className="bg-white rounded-2xl p-3.5 border border-[#E2E8F0] shadow-xs space-y-3 hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">{booking.customer_name}</h4>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                          {booking.service_name} • {booking.staff_name}
                        </p>
                        <p className="text-[9px] text-[#64748B] mt-0.5">
                          Date: <span className="font-semibold text-slate-700">{booking.date}</span> at <span className="font-semibold text-slate-700">{booking.time_slot}</span>
                        </p>
                      </div>
                      <span className="text-xs font-black text-[#0F172A]">₹{booking.price}</span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelBooking(booking.id);
                        }}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold py-2 rounded-xl transition-colors text-center border border-red-100"
                      >
                        Reject
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmBooking(booking.id);
                        }}
                        className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] font-bold py-2 rounded-xl transition-colors text-center shadow-xs"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* SECTION 3: Recent Payments */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-green-500 rounded-full inline-block" />
              Recent Payments (हाल के भुगतान)
            </h3>
            <button
              onClick={() => onNavigateTo('wallet')}
              className="text-[11px] font-bold text-[#2563EB] hover:underline"
            >
              Transactions
            </button>
          </div>

          {dbMock.getTransactions(shop.id).length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs text-center">
              <p className="text-xs text-slate-500">No payment history available.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] shadow-xs overflow-hidden">
              {dbMock.getTransactions(shop.id)
                .slice(0, 4)
                .map(tx => (
                  <div key={tx.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{tx.description}</p>
                      <p className="text-[9px] text-[#64748B] mt-0.5">
                        Ref: #{tx.id.toUpperCase()} • {tx.created_at.substring(0, 10)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                      </p>
                      <span className="inline-block text-[8px] font-bold uppercase tracking-wider bg-slate-100 text-[#64748B] px-1.5 py-0.5 rounded-md mt-0.5">
                        {tx.method}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* SECTION 4: Latest Notifications */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-purple-500 rounded-full inline-block" />
              Latest Notifications (अधिसूचनाएं)
            </h3>
            {unreadNotifCount > 0 && (
              <span className="bg-red-50 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {unreadNotifCount} New
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">No notifications available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications
                .slice(0, 3)
                .map(notif => (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      notif.is_read
                        ? 'bg-white border-[#E2E8F0] opacity-75'
                        : 'bg-purple-50/50 border-purple-100 shadow-2xs'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <p className={`text-xs ${notif.is_read ? 'font-semibold text-[#0F172A]' : 'font-bold text-[#0F172A]'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          {notif.msg}
                        </p>
                        <p className="text-[8px] text-[#64748B] font-medium pt-0.5">
                          {notif.time_ago}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => {
                            try {
                              dbMock.markNotificationRead(shop.id, notif.id);
                              loadData();
                              triggerToast('Notification marked as read.', 'success');
                            } catch (err) {}
                          }}
                          className="text-[9px] font-bold text-[#2563EB] hover:underline shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating Action Button (FAB) */}
      <div className="absolute bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setQaError('');
            setShowQuickAddModal(true);
          }}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-200 transition-colors cursor-pointer border border-blue-500"
          title="Quick Add Booking"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </motion.button>
      </div>

      {/* Quick Add Booking Modal Overlay */}
      {showQuickAddModal && (
        <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl p-5 w-full max-w-[380px] max-h-[92%] overflow-y-auto relative shadow-2xl border border-slate-100 flex flex-col z-50"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <PlusCircle className="w-5 h-5 text-blue-600 animate-pulse" />
                  Quick Add Booking
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Settle slot instantly from dashboard</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {qaError && (
              <div className="bg-red-50 text-red-600 text-[11px] p-2.5 rounded-xl border border-red-100 mb-4 font-semibold text-center">
                {qaError}
              </div>
            )}

            <form onSubmit={handleQuickAddBooking} className="space-y-3 flex-1">
              {/* Customer Name */}
              <div>
                <label className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Customer Name *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={qaCustomerName}
                    onChange={e => setQaCustomerName(e.target.value)}
                    placeholder="e.g. Aditi Rao"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={qaCustomerPhone}
                    onChange={e => setQaCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Service & Staff Select rows */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Service *
                  </label>
                  <select
                    required
                    value={qaServiceId}
                    onChange={e => setQaServiceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  >
                    <option value="">Select Service</option>
                    {services.map(srv => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} (₹{srv.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Staff Member *
                  </label>
                  <select
                    required
                    value={qaStaffId}
                    onChange={e => setQaStaffId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  >
                    <option value="">Assign Staff</option>
                    {staff.map(stf => (
                      <option key={stf.id} value={stf.id}>
                        {stf.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time Slot rows */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={qaDate}
                    onChange={e => setQaDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Time Slot *
                  </label>
                  <select
                    required
                    value={qaTimeSlot}
                    onChange={e => setQaTimeSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setQaPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      qaPaymentMethod === 'cash'
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-extrabold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    💵 Cash (नकद)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQaPaymentMethod('upi')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      qaPaymentMethod === 'upi'
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-extrabold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    📱 UPI (ऑनलाइन)
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Notes (टिप्पणी)
                </label>
                <textarea
                  value={qaNotes}
                  onChange={e => setQaNotes(e.target.value)}
                  placeholder="e.g. Special requests, preferences..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md shadow-blue-100 transition-colors"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
