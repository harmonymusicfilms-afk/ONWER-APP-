/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays,
  Plus,
  Search,
  User,
  Phone,
  Clock,
  Briefcase,
  ChevronLeft,
  X,
  CheckCircle,
  AlertCircle,
  Clock3,
  CalendarRange,
  Ban,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { Booking, Service, Staff, BlockedSlot, Shop } from '../types';

interface BookingsProps {
  shop: Shop;
  screenMode: 'list' | 'detail' | 'add' | 'block_slot';
  selectedBookingData?: Booking | null;
  onNavigateTo: (screen: string, extraData?: any) => void;
}

export default function Bookings({ shop, screenMode, selectedBookingData, onNavigateTo }: BookingsProps) {
  // Common states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

  // List Screen states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  // Add Manual Booking states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [bookingDate, setBookingDate] = useState('2026-07-02');
  const [bookingTime, setBookingTime] = useState('11:00');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Block Slot states
  const [blockStaffId, setBlockStaffId] = useState('all');
  const [blockDate, setBlockDate] = useState('2026-07-02');
  const [blockStart, setBlockStart] = useState('12:00');
  const [blockEnd, setBlockEnd] = useState('13:00');
  const [blockReason, setBlockReason] = useState('Lunch Break');

  // Detail view states
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  // Toast
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
    const list = dbMock.getBookings(shop.id);
    setBookings(list);
    setServices(dbMock.getServices(shop.id).filter(s => s.is_active));
    setStaff(dbMock.getStaff(shop.id).filter(s => s.is_available));
    setBlockedSlots(dbMock.getBlockedSlots(shop.id));

    if (selectedBookingData) {
      // Find the latest state from DB in case it updated
      const match = list.find(b => b.id === selectedBookingData.id);
      setDetailBooking(match || selectedBookingData);
    }
  };

  useEffect(() => {
    loadData();
  }, [shop.id, selectedBookingData, screenMode]);

  // Handle manual booking submit
  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !selectedServiceId || !selectedStaffId) {
      setError('Please fill in all mandatory fields (कृपया सभी आवश्यक फ़ील्ड भरें)');
      return;
    }
    setError('');

    try {
      const selectedService = services.find(s => s.id === selectedServiceId);
      const selectedStaffMember = staff.find(s => s.id === selectedStaffId);

      if (!selectedService || !selectedStaffMember) {
        setError('Selected service or staff is invalid.');
        return;
      }

      // Save new manual booking
      dbMock.saveBooking(shop.id, {
        customer_name: customerName,
        customer_phone: customerPhone,
        service_id: selectedServiceId,
        service_name: selectedService.name,
        price: selectedService.price,
        staff_id: selectedStaffId,
        staff_name: selectedStaffMember.name,
        date: bookingDate,
        time_slot: bookingTime,
        status: 'confirmed',
        payment_status: paymentMethod === 'upi' ? 'paid_online' : 'unpaid',
        payment_method: paymentMethod,
        notes
      });

      triggerToast('Booking added successfully! (बुकिंग जोड़ दी गई है!)', 'success');

      // Reset
      setCustomerName('');
      setCustomerPhone('');
      setSelectedServiceId('');
      setSelectedStaffId('');
      setNotes('');

      // Navigate back
      setTimeout(() => {
        onNavigateTo('home');
      }, 800);
    } catch (err) {
      setError('Error adding booking. Please retry.');
    }
  };

  // Handle block slot submit
  const handleBlockSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const staffMember = staff.find(s => s.id === blockStaffId);
      const staffName = staffMember ? staffMember.name : 'All Staff';

      dbMock.addBlockedSlot(shop.id, {
        staff_id: blockStaffId,
        staff_name: staffName,
        date: blockDate,
        start_time: blockStart,
        end_time: blockEnd,
        reason: blockReason
      });

      triggerToast('Time slot blocked successfully! (समय ब्लॉक कर दिया गया है!)', 'success');

      // Navigate to profile screen where block slot list lives
      setTimeout(() => {
        onNavigateTo('profile');
      }, 800);
    } catch (err) {
      setError('Error blocking slot. Please try again.');
    }
  };

  // Handle booking status updates
  const handleStatusChange = (status: 'confirmed' | 'completed' | 'cancelled') => {
    if (!detailBooking) return;

    try {
      const updated = dbMock.saveBooking(shop.id, {
        id: detailBooking.id,
        status,
        payment_status: status === 'completed' ? 'paid_online' : detailBooking.payment_status,
        payment_method: status === 'completed' ? 'cash' : detailBooking.payment_method
      });

      setDetailBooking(updated);
      triggerToast(`Booking marked as ${status}!`, 'success');
      loadData();
    } catch (err) {
      triggerToast('Error updating status', 'error');
    }
  };

  // Filtered Bookings for the list screen
  const filteredBookings = bookings.filter(booking => {
    // Search filter
    const matchesSearch =
      booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer_phone.includes(searchQuery);

    // Tab filter
    if (activeTab === 'all') return matchesSearch;
    return booking.status === activeTab && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-[580px] bg-slate-50 relative pb-20 overflow-y-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800 animate-slide-in">
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          {toast.msg}
        </div>
      )}

      {/* 1. BOOKINGS LIST SCREEN */}
      {screenMode === 'list' && (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mt-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Appointments (बुकिंग सूची)</h2>
              <p className="text-xs text-slate-500">Track and manage all shop bookings</p>
            </div>
            <button
              onClick={() => onNavigateTo('booking_add')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Book Manual
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name or mobile number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
            />
          </div>

          {/* Tab switches */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-bold px-3 py-2 rounded-lg uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List display */}
          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center">
                <CalendarDays className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No matching bookings found</p>
                <p className="text-xs text-slate-400 mt-0.5">Try changing filters or search query.</p>
              </div>
            ) : (
              filteredBookings.map(booking => (
                <div
                  key={booking.id}
                  onClick={() => onNavigateTo('booking_detail', booking)}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-800 border border-slate-100">
                      <span className="text-[10px] font-extrabold text-blue-600">
                        {booking.date.split('-')[2]}/{booking.date.split('-')[1]}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-800 mt-0.5">{booking.time_slot}</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{booking.customer_name}</h4>
                      <p className="text-[10px] font-semibold text-slate-600 mt-0.5">{booking.service_name}</p>
                      <p className="text-[9px] text-slate-400">Staff: {booking.staff_name}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-black text-slate-900">₹{booking.price}</span>
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
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. BOOKING DETAILS SCREEN */}
      {screenMode === 'detail' && detailBooking && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('bookings')}
              className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Booking Details (विवरण)</h2>
              <p className="text-xs text-slate-500">ID: #{detailBooking.id.toUpperCase()}</p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex gap-2.5 items-center">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{detailBooking.customer_name}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{detailBooking.customer_phone}</span>
                  </div>
                </div>
              </div>
              <span
                className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  detailBooking.status === 'completed'
                    ? 'bg-green-50 text-green-700'
                    : detailBooking.status === 'confirmed'
                    ? 'bg-blue-50 text-blue-700'
                    : detailBooking.status === 'pending'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {detailBooking.status}
              </span>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-1 text-xs">
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Service Requested</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {detailBooking.service_name}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Price Details</span>
                <span className="font-extrabold text-slate-900 mt-0.5 text-sm">₹{detailBooking.price}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Appointment Slot</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {detailBooking.time_slot} • {detailBooking.date}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Staff</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  {detailBooking.staff_name}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">OTP Code for Settle</span>
                <span className="font-extrabold text-blue-600 mt-0.5 text-sm font-mono tracking-wider">
                  {detailBooking.otp_code}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</span>
                <span
                  className={`inline-block font-semibold mt-0.5 uppercase text-[9px] px-2 py-0.5 rounded ${
                    detailBooking.payment_status === 'paid_online'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {detailBooking.payment_status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {detailBooking.notes && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 mt-4 leading-relaxed">
                <span className="font-bold block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Owner Notes:</span>
                {detailBooking.notes}
              </div>
            )}
          </div>

          {/* Action Pathways */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions (त्वरित कार्रवाई)</h4>

            {detailBooking.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold py-2.5 rounded-xl border border-red-100 transition-colors"
                >
                  Reject / Cancel
                </button>
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-colors"
                >
                  Accept Booking
                </button>
              </div>
            )}

            {detailBooking.status === 'confirmed' && (
              <div className="space-y-2">
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl shadow flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Completed (UPI / Cash Payment Settle)
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-red-600 text-xs font-bold py-2.5 rounded-xl transition-colors text-center"
                >
                  Cancel Appointment
                </button>
              </div>
            )}

            {detailBooking.status === 'completed' && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 p-3 rounded-xl text-green-800 text-xs font-semibold">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                This booking has already been settled and funds credited to wallet summary.
              </div>
            )}

            {detailBooking.status === 'cancelled' && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 p-3 rounded-xl text-red-800 text-xs font-semibold">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                This booking has been cancelled and blocked slots released.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ADD MANUAL BOOKING SCREEN */}
      {screenMode === 'add' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('home')}
              className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Manual Booking (बुकिंग जोड़ें)</h2>
              <p className="text-xs text-slate-500">Insert walk-in or offline telephone customer</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddBooking} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Customer Name (ग्राहक का नाम) *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Customer Mobile Number (मोबाइल नंबर) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+91 99XXX XXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Select Service (सेवा) *
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={e => setSelectedServiceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Assign Staff (कर्मचारी) *
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={e => setSelectedStaffId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  >
                    <option value="">Assign Staff</option>
                    {staff.map(stf => (
                      <option key={stf.id} value={stf.id}>
                        {stf.name} ({stf.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Time Slot *
                  </label>
                  <select
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="19:00">07:00 PM</option>
                    <option value="20:00">08:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Payment Collection Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Pay Cash on Settle
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Pay via UPI Counter QR
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Booking Notes (टिप्पणियां)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Customer requested extra hot water/tea, sensitive skin, etc."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3.5 rounded-xl shadow-md transition-colors pt-2.5"
              >
                Confirm Booking Settle (बुकिंग की पुष्टि करें)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. BLOCK TIME SLOT SCREEN */}
      {screenMode === 'block_slot' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('home')}
              className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Block Time Slot (समय ब्लॉक करें)</h2>
              <p className="text-xs text-slate-500">Temporarily block slots for meetings, lunch, or breaks</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleBlockSlot} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Which Staff Member? (कर्मचारी चुनें) *
                </label>
                <select
                  value={blockStaffId}
                  onChange={e => setBlockStaffId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                >
                  <option value="all">Block all staff slots (पूरा आउटलेट ब्लॉक करें)</option>
                  {staff.map(stf => (
                    <option key={stf.id} value={stf.id}>
                      {stf.name} ({stf.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Blocking Date *
                </label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={e => setBlockDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    From Time *
                  </label>
                  <input
                    type="time"
                    value={blockStart}
                    onChange={e => setBlockStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    To Time *
                  </label>
                  <input
                    type="time"
                    value={blockEnd}
                    onChange={e => setBlockEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Reason for Blocking (ब्लॉक करने का कारण) *
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="e.g. Lunch break, power outage, maintenance, emergency leave"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-3.5 rounded-xl shadow transition-colors pt-2.5"
              >
                Block Selected Slots (लॉक स्लॉट सुरक्षित करें)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
