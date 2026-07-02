/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Briefcase,
  AlertCircle,
  FileText
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { Customer, Booking, Shop } from '../types';

interface CustomersProps {
  shop: Shop;
  screenMode: 'list' | 'detail';
  selectedCustomerData?: Customer | null;
  onNavigateTo: (screen: string, extraData?: any) => void;
}

export default function Customers({ shop, screenMode, selectedCustomerData, onNavigateTo }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const list = dbMock.getCustomers(shop.id);
    setCustomers(list);
    setBookings(dbMock.getBookings(shop.id));

    if (selectedCustomerData) {
      const match = list.find(c => c.id === selectedCustomerData.id);
      setDetailCustomer(match || selectedCustomerData);
    }
  }, [shop.id, selectedCustomerData, screenMode]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  // Derive customer appointment history
  const customerHistory = detailCustomer
    ? bookings.filter(b => b.customer_phone === detailCustomer.phone)
    : [];

  return (
    <div className="flex flex-col min-h-[580px] bg-slate-50 pb-20 relative overflow-y-auto">
      {/* 1. CUSTOMERS LIST SCREEN */}
      {screenMode === 'list' && (
        <div className="p-4 space-y-4">
          <div className="mt-2">
            <h2 className="text-xl font-bold text-slate-900">Customers Base (ग्राहक सूची)</h2>
            <p className="text-xs text-slate-500">Track purchase history and preferences</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers by name or mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
            />
          </div>

          {/* Customer list rendering */}
          <div className="space-y-3">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center">
                <Users className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No customers recorded yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Customers will automatically register during bookings.</p>
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => onNavigateTo('customer_detail', customer)}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-extrabold text-sm">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{customer.name}</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Visits: <span className="font-semibold text-slate-700">{customer.total_bookings}</span> • Last visit:{' '}
                        <span className="font-semibold text-slate-700">{customer.last_visit_date || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total spent</span>
                    <span className="text-xs font-black text-slate-900 mt-0.5">₹{customer.total_spent}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. CUSTOMER DETAILS SCREEN */}
      {screenMode === 'detail' && detailCustomer && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('customers')}
              className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Customer Profile</h2>
              <p className="text-xs text-slate-500">Full visit logs & preferences</p>
            </div>
          </div>

          {/* Profile overview box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
            <div className="flex gap-3.5 items-center border-b border-slate-100 pb-3">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-lg">
                {detailCustomer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{detailCustomer.name}</h3>
                <div className="space-y-0.5 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{detailCustomer.phone}</span>
                  </div>
                  {detailCustomer.email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{detailCustomer.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
                <span className="text-base font-extrabold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {detailCustomer.total_bookings} visits
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Value</span>
                <span className="text-base font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ₹{detailCustomer.total_spent}
                </span>
              </div>
            </div>

            {/* Custom Notes / Preferences */}
            <div className="bg-amber-50/55 border border-amber-100 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                <FileText className="w-3.5 h-3.5" />
                Customer notes & preferences
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {detailCustomer.notes || 'No custom preferences recorded yet. Perfect for storing customer beverage choice, skin sensitivity, or preferred staff member.'}
              </p>
            </div>
          </div>

          {/* History of appointments */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appointment Logs ({customerHistory.length})</h3>

            {customerHistory.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
                <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500">No booking history detected</p>
              </div>
            ) : (
              customerHistory.map(b => (
                <div
                  key={b.id}
                  onClick={() => onNavigateTo('booking_detail', b)}
                  className="bg-white rounded-xl p-3 border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex gap-2.5 items-center">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{b.service_name}</h4>
                      <p className="text-[10px] text-slate-500">{b.date} • {b.time_slot}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">₹{b.price}</span>
                    <span className="text-[9px] font-semibold text-slate-400 capitalize">{b.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
