/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  UserCheck,
  Download,
  MessageCircle
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
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'pending' | 'completed' | 'cancelled' | 'no_show'>('today');

  // Add Manual Booking states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [bookingDate, setBookingDate] = useState('2026-07-02');
  const [bookingTime, setBookingTime] = useState('11:00');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [notes, setNotes] = useState('');
  const [bookingAmount, setBookingAmount] = useState<number | ''>('');
  const [error, setError] = useState('');

  // OTP Verification for Completion
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

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
    if (screenMode === 'add' && selectedBookingData) {
      setCustomerName(selectedBookingData.customer_name);
      setCustomerPhone(selectedBookingData.customer_phone);
      setSelectedServiceId(selectedBookingData.service_id);
    }
  }, [shop.id, selectedBookingData, screenMode]);

  useEffect(() => {
    if (selectedServiceId) {
      const srv = services.find(s => s.id === selectedServiceId);
      if (srv) {
        setBookingAmount(srv.price);
      }
    } else {
      setBookingAmount('');
    }
  }, [selectedServiceId, services]);


  const getAvailableTimeSlots = () => {
    const slots = [
      "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
    ];
    
    return slots.filter(slot => {
      // Check if slot overlaps with any active blocked slot for the selected staff
      return !blockedSlots.some(block => {
        if (block.is_active === false) return false;
        if (block.date !== bookingDate) return false;
        if (block.staff_id !== 'all' && block.staff_id !== selectedStaffId) return false;
        
        // Simple string comparison works for HH:MM format
        return slot >= block.start_time && slot < block.end_time;
      });
    });
  };

  const availableTimeSlots = getAvailableTimeSlots();

  // Export filtered bookings to CSV for accounting / daily records
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      triggerToast('No bookings in current view to export! (निर्यात करने के लिए कोई बुकिंग नहीं है!)', 'error');
      return;
    }

    // Define columns
    const headers = [
      'Booking ID',
      'Customer Name',
      'Customer Phone',
      'Service Name',
      'Price (INR)',
      'Date',
      'Time Slot',
      'Staff Member',
      'Status',
      'Payment Method',
      'Created At'
    ];

    // Format fields with quotes & escape double-quotes
    const csvRows = [
      headers.join(','),
      ...filteredBookings.map(b => {
        return [
          `"${b.id}"`,
          `"${(b.customer_name || '').replace(/"/g, '""')}"`,
          `"${(b.customer_phone || '').replace(/"/g, '""')}"`,
          `"${(b.service_name || '').replace(/"/g, '""')}"`,
          b.price,
          `"${b.date}"`,
          `"${b.time_slot}"`,
          `"${b.staff_name ? b.staff_name.replace(/"/g, '""') : 'Unassigned'}"`,
          `"${b.status.toUpperCase()}"`,
          `"${(b.payment_method || 'cash').toUpperCase()}"`,
          `"${b.created_at || ''}"`
        ].join(',');
      })
    ];

    // Append standard UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = "\uFEFF" + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nexora_bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('Bookings CSV exported successfully! (CSV डाउनलोड संपन्न हुआ!)', 'success');
  };

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
        price: Number(bookingAmount) || selectedService.price,
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

      dbMock.saveBlockedSlot(shop.id, {
        staff_id: blockStaffId,
        staff_name: staffName,
        date: blockDate,
        start_time: blockStart,
        end_time: blockEnd,
        reason: blockReason,
        is_active: true
      });

      triggerToast('Time slot blocked successfully! (समय ब्लॉक कर दिया गया है!)', 'success');
      loadData();
    } catch (err) {
      setError('Error blocking slot. Please try again.');
    }
  };

  const handleToggleBlockSlot = (slot: BlockedSlot) => {
    dbMock.saveBlockedSlot(shop.id, { ...slot, is_active: !slot.is_active });
    triggerToast(slot.is_active ? 'Slot Unblocked!' : 'Slot Blocked!', 'success');
    loadData();
  };
// Handle booking status updates
  const handleStatusChange = (status: 'confirmed' | 'completed' | 'cancelled' | 'no_show') => {
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

  const handleInitiateCompletion = () => {
    setShowOtpModal(true);
    setOtpInput('');
    setOtpError('');
  };

  const handleVerifyOtpAndComplete = () => {
    if (!detailBooking) return;
    if (otpInput !== detailBooking.otp_code) {
      setOtpError('Invalid OTP code. Please check with the customer.');
      return;
    }
    setShowOtpModal(false);
    handleStatusChange('completed');
  };

  // Handle list screen direct booking status updates
  const handleBookingStatusUpdate = (bookingId: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show') => {
    try {
      dbMock.saveBooking(shop.id, {
        id: bookingId,
        status,
        payment_status: status === 'completed' ? 'paid_online' : undefined,
        payment_method: status === 'completed' ? 'cash' : undefined
      });
      triggerToast(`Booking updated successfully!`, 'success');
      loadData();
    } catch (err) {
      triggerToast('Error updating status.', 'error');
    }
  };

  // Filtered Bookings for the list screen
  const todayStr = '2026-07-02'; // Static simulated "today"
  const filteredBookings = bookings.filter(booking => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      booking.customer_name.toLowerCase().includes(query) ||
      booking.service_name.toLowerCase().includes(query) ||
      booking.customer_phone.includes(searchQuery);

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'today') {
      return booking.date === todayStr;
    }
    if (activeTab === 'upcoming') {
      return booking.date > todayStr;
    }
    if (activeTab === 'pending') {
      return booking.status === 'pending';
    }
    if (activeTab === 'completed') {
      return booking.status === 'completed';
    }
    if (activeTab === 'cancelled') {
      return booking.status === 'cancelled';
    }
    if (activeTab === 'no_show') {
      return booking.status === 'no_show';
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-[580px] bg-[#F8FAFC] relative pb-20 overflow-y-auto">
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
          <div className="flex justify-between items-start mt-2 gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">Appointments (बुकिंग सूची)</h2>
              <p className="text-xs text-[#64748B]">Track and manage all shop bookings</p>
            </div>
            <div className="flex flex-col xs:flex-row gap-1.5 shrink-0">
              <button
                onClick={handleExportCSV}
                className="bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] text-xs font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                title="Export current view to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#64748B]" />
                Export CSV
              </button>
              <button
                onClick={() => onNavigateTo('booking_add')}
                className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Book Manual
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name or service type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-[#2563EB] transition-colors shadow-xs"
            />
          </div>

          {/* Tab switches */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {([
              { value: 'today', label: 'Today' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'no_show', label: 'No Show' }
            ] as const).map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`text-[10px] font-bold px-3 py-2 rounded-lg uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === tab.value
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List display */}
          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center flex flex-col items-center">
                <CalendarRange className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No matching bookings found</p>
                <p className="text-xs text-[#64748B] mt-0.5">Try changing filters or search query.</p>
              </div>
            ) : (
              filteredBookings.map(booking => (
                <div
                  key={booking.id}
                  onClick={() => onNavigateTo('booking_detail', booking)}
                  className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs hover:shadow-sm transition-all cursor-pointer space-y-4 text-left"
                >
                  {/* Top Row: Date, Customer, Status Badges */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-[#2563EB]">
                          {booking.date.split('-')[2]}/{booking.date.split('-')[1]}
                        </span>
                        <span className="text-[9px] font-bold text-[#0F172A] mt-0.5">{booking.time_slot}</span>
                      </div>

                      <div>
                        <h4 className="text-xs font-extrabold text-[#0F172A]">{booking.customer_name}</h4>
                        <p className="text-[10px] font-medium text-[#64748B] mt-0.5">{booking.customer_phone}</p>
                        <p className="text-[10px] font-semibold text-slate-700 mt-1">
                          Service: <span className="text-[#2563EB]">{booking.service_name}</span>
                        </p>
                        <p className="text-[9px] text-[#64748B] mt-0.5">Staff: {booking.staff_name}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-black text-[#0F172A]">₹{booking.price}</span>
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
                      <span
                        className={`text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                          booking.payment_status === 'paid_online' || booking.payment_status === 'paid_cash'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {booking.payment_status ? booking.payment_status.replace('_', ' ') : 'pending'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    {/* Communication Actions */}
                    <div className="flex gap-1.5">
                      <a
                        href={`tel:${booking.customer_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors flex items-center gap-1 text-[10px] font-extrabold uppercase"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${booking.customer_phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(booking.customer_name)},%20this%20is%20regarding%20your%20appointment%20at%20${encodeURIComponent(shop.name)}.`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-200 transition-colors flex items-center gap-1 text-[10px] font-extrabold uppercase"
                        title="WhatsApp Message"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                        WhatsApp
                      </a>
                    </div>

                    {/* Booking Status Transition Actions */}
                    <div className="flex gap-1.5">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookingStatusUpdate(booking.id, 'cancelled');
                            }}
                            className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 text-[10px] font-extrabold uppercase rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookingStatusUpdate(booking.id, 'confirmed');
                            }}
                            className="px-2.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] font-extrabold uppercase rounded-xl transition-colors shadow-2xs"
                          >
                            Confirm
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookingStatusUpdate(booking.id, 'cancelled');
                            }}
                            className="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 text-red-600 border border-slate-200 text-[10px] font-extrabold uppercase rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookingStatusUpdate(booking.id, 'no_show');
                            }}
                            className="px-2.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase rounded-xl transition-colors"
                          >
                            No Show
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookingStatusUpdate(booking.id, 'completed');
                            }}
                            className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded-xl transition-colors shadow-2xs"
                          >
                            Complete
                          </button>
                        </>
                      )}
                    </div>
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
              className="p-1.5 bg-white border border-[#E2E8F0] rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Booking Details (विवरण)</h2>
              <p className="text-xs text-[#64748B]">ID: #{detailBooking.id.toUpperCase()}</p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3.5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex gap-2.5 items-center">
                <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">{detailBooking.customer_name}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-0.5">
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
                    ? 'bg-blue-50 text-[#2563EB]'
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
                <span className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Service Requested</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {detailBooking.service_name}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Price Details</span>
                <span className="font-extrabold text-[#0F172A] mt-0.5 text-sm">₹{detailBooking.price}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Appointment Slot</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {detailBooking.time_slot} • {detailBooking.date}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Assigned Staff</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  {detailBooking.staff_name}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider">OTP Code for Settle</span>
                <span className="font-extrabold text-[#2563EB] mt-0.5 text-sm font-mono tracking-wider">
                  {detailBooking.otp_code}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Payment Status</span>
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
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#64748B] mt-4 leading-relaxed">
                <span className="font-bold block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Owner Notes:</span>
                {detailBooking.notes}
              </div>
            )}
          </div>

          {/* Action Pathways */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Quick Actions (त्वरित कार्रवाई)</h4>

            <div className="flex gap-2">
              <a href={`tel:${detailBooking.customer_phone}`} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Call Customer
              </a>
              <a href={`https://wa.me/${detailBooking.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold py-2.5 rounded-xl border border-green-200 transition-colors flex items-center justify-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>
            
            <button
              onClick={() => onNavigateTo('booking_add', detailBooking)}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Rebook Customer
            </button>

            {detailBooking.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold py-2.5 rounded-xl border border-red-100 transition-colors"
                >
                  Reject / Cancel
                </button>
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-colors"
                >
                  Accept Booking
                </button>
              </div>
            )}

            {detailBooking.status === 'confirmed' && (
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleInitiateCompletion}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl shadow flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Completed (Enter OTP)
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className="flex-1 bg-[#F8FAFC] hover:bg-slate-100 text-red-600 text-xs font-bold py-2.5 rounded-xl transition-colors text-center border border-[#E2E8F0]"
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={() => handleStatusChange('no_show')}
                    className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold py-2.5 rounded-xl transition-colors text-center border border-amber-200"
                  >
                    No Show
                  </button>
                </div>
              </div>
            )}

            {detailBooking.status === 'completed' && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 p-3 rounded-xl text-green-800 text-xs font-semibold mt-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                This booking has already been settled and funds credited to wallet summary.
              </div>
            )}

            {detailBooking.status === 'cancelled' && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 p-3 rounded-xl text-red-800 text-xs font-semibold mt-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                This booking has been cancelled and blocked slots released.
              </div>
            )}
            
            {detailBooking.status === 'no_show' && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 p-3 rounded-xl text-amber-800 text-xs font-semibold mt-2">
                <Ban className="w-5 h-5 flex-shrink-0" />
                Customer marked as no show. Slot was freed.
              </div>
            )}
          </div>
        </div>
      )}

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Complete Booking</h3>
                <button
                  onClick={() => setShowOtpModal(false)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Ask the customer for their <span className="font-bold text-slate-800">4-digit OTP Code</span> to verify and complete this service.
                </p>
                {otpError && (
                  <div className="bg-red-50 text-red-600 text-xs p-2.5 rounded-lg border border-red-100 font-semibold flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}
                <div>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Enter 4-digit OTP"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
                <button
                  onClick={handleVerifyOtpAndComplete}
                  disabled={otpInput.length !== 4}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                >
                  Verify & Complete
                </button>
                <div className="pt-2 text-center">
                  <p className="text-[10px] text-slate-400 font-medium">
                    Can't find the code? <button onClick={() => onNavigateTo('help')} className="text-blue-600 font-bold hover:underline">Contact Support</button> for admin override.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. ADD MANUAL BOOKING SCREEN */}
      {screenMode === 'add' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('home')}
              className="p-1.5 bg-white border border-[#E2E8F0] rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Add Manual Booking (बुकिंग जोड़ें)</h2>
              <p className="text-xs text-[#64748B]">Insert walk-in or offline telephone customer</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddBooking} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Customer Name (ग्राहक का नाम) *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Customer Mobile Number (मोबाइल नंबर) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+91 99XXX XXXXX"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Select Service (सेवा) *
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={e => setSelectedServiceId(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
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
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Assign Staff (कर्मचारी) *
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={e => setSelectedStaffId(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
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
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Time Slot *
                  </label>
                  <select
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  >
                    <option value="" disabled>Select a time</option>
                    {availableTimeSlots.map(time => {
                      const ampm = parseInt(time) >= 12 ? 'PM' : 'AM';
                      const hour12 = parseInt(time) % 12 || 12;
                      const label = `${hour12.toString().padStart(2, '0')}:00 ${ampm}`;
                      return <option key={time} value={time}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Amount (रकम) *
                  </label>
                  <input
                    type="number"
                    value={bookingAmount}
                    onChange={e => setBookingAmount(Number(e.target.value))}
                    placeholder="₹ 0.00"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    Payment Collection Mode
                  </label>
                  <div className="flex flex-col gap-2 mt-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      Pay Cash on Settle
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      Pay via UPI Counter QR
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Booking Notes (टिप्पणियां)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Customer requested extra hot water/tea, sensitive skin, etc."
                  rows={2}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2 px-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold py-3.5 rounded-xl shadow-md transition-colors pt-2.5"
              >
                Save Booking
              </button>
            </form>
          </div>

          {/* Active Blocked Slots */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-[#0F172A] mb-3 uppercase tracking-wider px-1">Currently Blocked Slots</h3>
            <div className="space-y-3">
              {blockedSlots.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-[#E2E8F0]">
                  <p className="text-xs text-slate-500">No time slots are currently blocked.</p>
                </div>
              ) : (
                blockedSlots.map(slot => (
                  <div key={slot.id} className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">{slot.reason || 'Blocked Slot'}</h4>
                        <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Staff: {slot.staff_name}</p>
                      </div>
                      <button
                        onClick={() => handleToggleBlockSlot(slot)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${slot.is_active !== false ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100' : 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100'}`}
                      >
                        {slot.is_active !== false ? 'Unblock' : 'Enable Block'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 mt-1">
                      <CalendarRange className="w-3.5 h-3.5 text-blue-500" />
                      {slot.date}
                      <Clock3 className="w-3.5 h-3.5 text-amber-500 ml-2" />
                      {slot.start_time} - {slot.end_time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* 4. BLOCK TIME SLOT SCREEN */}
      {screenMode === 'block_slot' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('home')}
              className="p-1.5 bg-white border border-[#E2E8F0] rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Block Time Slot (समय ब्लॉक करें)</h2>
              <p className="text-xs text-[#64748B]">Temporarily block slots for meetings, lunch, or breaks</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleBlockSlot} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Which Staff Member? (कर्मचारी चुनें) *
                </label>
                <select
                  value={blockStaffId}
                  onChange={e => setBlockStaffId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
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
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Blocking Date *
                </label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={e => setBlockDate(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    From Time *
                  </label>
                  <input
                    type="time"
                    value={blockStart}
                    onChange={e => setBlockStart(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                    To Time *
                  </label>
                  <input
                    type="time"
                    value={blockEnd}
                    onChange={e => setBlockEnd(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Reason for Blocking (ब्लॉक करने का कारण) *
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="e.g. Lunch break, power outage, maintenance, emergency leave"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold py-3.5 rounded-xl shadow transition-colors pt-2.5"
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
