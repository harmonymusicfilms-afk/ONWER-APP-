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
  FileText,
  Tag,
  X,
  MessageCircle,
  Trophy,
  Filter
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { Customer, Booking, Shop } from '../types';

interface CustomersProps {
  shop: Shop;
  screenMode: 'list' | 'detail';
  selectedCustomerData?: Customer | null;
  onNavigateTo: (screen: string, extraData?: any) => void;
}

type Tier = 'Gold' | 'Silver' | 'Bronze';

const getCustomerTier = (customer: Customer): Tier => {
  if (customer.total_bookings >= 10 || customer.total_spent >= 5000) return 'Gold';
  if (customer.total_bookings >= 3 || customer.total_spent >= 1500) return 'Silver';
  return 'Bronze';
};

const getTierColor = (tier: Tier) => {
  switch (tier) {
    case 'Gold': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'Silver': return 'text-slate-500 bg-slate-50 border-slate-100';
    case 'Bronze': return 'text-orange-600 bg-orange-50 border-orange-100';
  }
};

export default function Customers({ shop, screenMode, selectedCustomerData, onNavigateTo }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // Tagging State
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  
  const PREDEFINED_TAGS = ['VIP', 'Regular', 'New', 'Lead', 'Loyal', 'High Value'];

  useEffect(() => {
    const list = dbMock.getCustomers(shop.id);
    setCustomers(list);
    setBookings(dbMock.getBookings(shop.id));

    if (selectedCustomerData) {
      const match = list.find(c => c.id === selectedCustomerData.id);
      setDetailCustomer(match || selectedCustomerData);
    }
  }, [shop.id, selectedCustomerData, screenMode]);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesVip = showVipOnly ? getCustomerTier(c) === 'Gold' : true;
    return matchesSearch && matchesVip;
  });

  // Derive customer appointment history
  const customerHistory = detailCustomer
    ? bookings.filter(b => b.customer_phone === detailCustomer.phone)
    : [];

  const handleToggleTag = (tag: string) => {
    if (!detailCustomer) return;
    
    let currentTags = detailCustomer.tags || [];
    let updatedTags = [];
    
    if (currentTags.includes(tag)) {
      updatedTags = currentTags.filter(t => t !== tag);
    } else {
      updatedTags = [...currentTags, tag];
    }
    
    const updatedCustomer = { ...detailCustomer, tags: updatedTags };
    
    // Save to DB
    const savedCustomer = dbMock.saveCustomer(shop.id, updatedCustomer);
    setDetailCustomer(savedCustomer);
    
    // Update list
    setCustomers(prev => prev.map(c => c.id === savedCustomer.id ? savedCustomer : c));
  };

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const tag = newTagInput.trim();
      if (!detailCustomer?.tags?.includes(tag)) {
        handleToggleTag(tag);
      }
      setNewTagInput('');
    }
  };

  const completedBookings = customerHistory.filter(b => b.status === 'completed').length;
  const cancelledBookings = customerHistory.filter(b => b.status === 'cancelled' || b.status === 'no_show').length;
  const completedHistory = customerHistory.filter(b => b.status === 'completed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastService = completedHistory.length > 0 ? completedHistory[0].service_name : 'None';
  
  const staffCount: Record<string, number> = {};
  customerHistory.forEach(b => {
    if (b.staff_name) {
      staffCount[b.staff_name] = (staffCount[b.staff_name] || 0) + 1;
    }
  });
  let favouriteStaff = 'None';
  let maxStaffCount = 0;
  Object.entries(staffCount).forEach(([name, count]) => {
    if (count > maxStaffCount) {
      favouriteStaff = name;
      maxStaffCount = count;
    }
  });

  return (
    <div className="flex flex-col min-h-[580px] bg-[#F8FAFC] pb-20 relative overflow-y-auto">
      {/* 1. CUSTOMERS LIST SCREEN */}
      {screenMode === 'list' && (
        <div className="p-4 space-y-4">
          <div className="mt-2">
            <h2 className="text-xl font-bold text-[#0F172A]">Customers Base (ग्राहक सूची)</h2>
            <p className="text-xs text-[#64748B]">Track purchase history and preferences</p>
          </div>

          {/* Search and filter bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-[#2563EB] transition-colors shadow-xs"
              />
            </div>
            <button
              onClick={() => setShowVipOnly(!showVipOnly)}
              className={`px-3 rounded-xl border transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                showVipOnly 
                  ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm' 
                  : 'bg-white border-[#E2E8F0] text-slate-500'
              }`}
            >
              <Trophy className={`w-3.5 h-3.5 ${showVipOnly ? 'fill-amber-400' : ''}`} />
              VIP Only
            </button>
          </div>

          {/* Customer list rendering */}
          <div className="space-y-3">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center flex flex-col items-center">
                <Users className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No customers recorded yet</p>
                <p className="text-xs text-[#64748B] mt-0.5">Customers will automatically register during bookings.</p>
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center font-extrabold text-sm border-2 border-white shadow-sm">
                          {customer.name.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${getTierColor(getCustomerTier(customer)).split(' ')[1]}`}>
                          <Trophy className={`w-2.5 h-2.5 ${getTierColor(getCustomerTier(customer)).split(' ')[0]}`} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold text-[#0F172A]">{customer.name}</h4>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border ${getTierColor(getCustomerTier(customer))}`}>
                            {getCustomerTier(customer)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5 mb-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                        {customer.tags && customer.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {customer.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[8px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-sm">
                                {tag}
                              </span>
                            ))}
                            {customer.tags.length > 3 && (
                              <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm">
                                +{customer.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-[9px] text-slate-400">
                          Visits: <span className="font-semibold text-slate-700">{customer.total_bookings}</span> • Last visit:{' '}
                          <span className="font-semibold text-slate-700">{customer.last_visit_date || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total spent</span>
                      <span className="text-xs font-black text-[#0F172A] mt-0.5">₹{customer.total_spent}</span>
                      <span className="text-[9px] font-bold text-amber-500 mt-1 flex items-center gap-0.5">
                        ★ {customer.reward_points || Math.floor(customer.total_spent / 100)} pts
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <a href={`tel:${customer.phone}`} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold py-2 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1">
                      <Phone className="w-3 h-3" /> Call
                    </a>
                    <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-[10px] font-bold py-2 rounded-xl border border-green-200 transition-colors flex items-center justify-center gap-1">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                    <button onClick={() => onNavigateTo('customer_detail', customer)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold py-2 rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-1">
                      <FileText className="w-3 h-3" /> View History
                    </button>
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
              className="p-1.5 bg-white border border-[#E2E8F0] rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-[#64748B]" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Customer Profile</h2>
              <p className="text-xs text-[#64748B]">Full visit logs & preferences</p>
            </div>
          </div>

          {/* Profile overview box */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex gap-4 items-center border-b border-slate-100 pb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center font-black text-2xl border-4 border-white shadow-sm">
                  {detailCustomer.name.charAt(0)}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-md ${getTierColor(getCustomerTier(detailCustomer)).split(' ')[1]}`}>
                  <Trophy className={`w-4 h-4 ${getTierColor(getCustomerTier(detailCustomer)).split(' ')[0]}`} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-[#0F172A]">{detailCustomer.name}</h3>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getTierColor(getCustomerTier(detailCustomer))}`}>
                    {getCustomerTier(detailCustomer)} Member
                  </span>
                </div>
                <div className="space-y-0.5 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{detailCustomer.phone}</span>
                  </div>
                  {detailCustomer.email && (
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{detailCustomer.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Total Bookings</span>
                <span className="text-base font-extrabold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {detailCustomer.total_bookings}
                </span>
                <div className="mt-2 flex justify-between text-[10px] text-slate-500 font-medium">
                  <span className="text-emerald-600 font-bold">{completedBookings} Completed</span>
                  <span className="text-red-500 font-bold">{cancelledBookings} Cancelled</span>
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Total Value</span>
                  <span className="text-base font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ₹{detailCustomer.total_spent}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                  ★ {detailCustomer.reward_points || Math.floor(detailCustomer.total_spent / 100)} Points
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Last Service</span>
                <span className="text-[11px] font-bold text-slate-700">{lastService}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Fav Staff</span>
                <span className="text-[11px] font-bold text-slate-700">{favouriteStaff}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <a href={`tel:${detailCustomer.phone}`} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
              <a href={`https://wa.me/${detailCustomer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold py-2.5 rounded-xl border border-green-200 transition-colors flex items-center justify-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>
            <button onClick={() => onNavigateTo('booking_add', { customer_name: detailCustomer.name, customer_phone: detailCustomer.phone })} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm">
              <Calendar className="w-4 h-4" /> Add Booking
            </button>

            {/* Tags Section */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Customer Tags
                </span>
                <button
                  onClick={() => setIsEditingTags(!isEditingTags)}
                  className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                >
                  {isEditingTags ? 'Done' : 'Edit Tags'}
                </button>
              </div>

              {/* Display existing tags */}
              {(!isEditingTags && (!detailCustomer.tags || detailCustomer.tags.length === 0)) && (
                <p className="text-xs text-slate-500 italic">No tags added yet.</p>
              )}

              <div className="flex flex-wrap gap-2">
                {detailCustomer.tags?.map(tag => (
                  <span key={tag} className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    {tag}
                    {isEditingTags && (
                      <button onClick={() => handleToggleTag(tag)} className="hover:bg-slate-200 rounded-full p-0.5">
                        <X className="w-3 h-3 text-slate-500" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Tag Editor */}
              {isEditingTags && (
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-semibold text-slate-500">SUGGESTED TAGS:</p>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TAGS.map(tag => {
                      const isSelected = detailCustomer.tags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => handleToggleTag(tag)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-md border transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200 text-blue-700' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected && '✓ '} {tag}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleAddCustomTag}
                      placeholder="Type custom tag & press Enter..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Custom Notes / Preferences */}
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3">
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
            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Appointment Logs ({customerHistory.length})</h3>

            {customerHistory.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-[#E2E8F0]">
                <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-[#64748B]">No booking history detected</p>
              </div>
            ) : (
              customerHistory.map(b => (
                <div
                  key={b.id}
                  onClick={() => onNavigateTo('booking_detail', b)}
                  className="bg-white rounded-xl p-3 border border-[#E2E8F0] flex justify-between items-center cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex gap-2.5 items-center">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">{b.service_name}</h4>
                      <p className="text-[10px] text-[#64748B]">{b.date} • {b.time_slot}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-[#0F172A] block">₹{b.price}</span>
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
