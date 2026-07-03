/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Plus,
  Phone,
  ChevronLeft,
  X,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Star,
  Sparkles
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { Staff, Shop } from '../types';

interface StaffProps {
  shop: Shop;
  screenMode: 'list' | 'add_edit';
  selectedStaffData?: Staff | null;
  onNavigateTo: (screen: string, extraData?: any) => void;
}

export default function StaffList({ shop, screenMode, selectedStaffData, onNavigateTo }: StaffProps) {
  const [staff, setStaff] = useState<Staff[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Hair Stylist');
  const [phone, setPhone] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80');
  const [availableDays, setAvailableDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('21:00');
  const [error, setError] = useState('');

  // Toast
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const triggerToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const loadData = () => {
    const list = dbMock.getStaff(shop.id);
    setStaff(list);

    if (screenMode === 'add_edit' && selectedStaffData) {
      setName(selectedStaffData.name);
      setRole(selectedStaffData.role);
      setPhone(selectedStaffData.phone);
      setIsAvailable(selectedStaffData.is_available);
      setAvatar(selectedStaffData.avatar);
      setAvailableDays(selectedStaffData.available_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
      setOpeningTime(selectedStaffData.opening_time || '09:00');
      setClosingTime(selectedStaffData.closing_time || '21:00');
    } else if (screenMode === 'add_edit') {
      setName('');
      setRole('Hair Stylist');
      setPhone('');
      setIsAvailable(true);
      setAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80');
      setAvailableDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
      setOpeningTime('09:00');
      setClosingTime('21:00');
    }
  };

  useEffect(() => {
    loadData();
  }, [shop.id, selectedStaffData, screenMode]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !phone) {
      setError('All fields are mandatory (सभी फ़ील्ड आवश्यक हैं)');
      return;
    }
    setError('');

    try {
      dbMock.saveStaff(shop.id, {
        id: selectedStaffData?.id,
        name: name.trim(),
        role: role.trim(),
        phone: phone.trim(),
        is_available: isAvailable,
        avatar,
        available_days: availableDays,
        opening_time: openingTime,
        closing_time: closingTime
      });

      triggerToast(selectedStaffData ? 'Staff details updated!' : 'Staff member registered successfully!');

      setTimeout(() => {
        onNavigateTo('profile'); // Staff list hosted in Profile menu
      }, 800);
    } catch (err) {
      setError('Could not save staff. Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      dbMock.deleteStaff(shop.id, id);
      triggerToast('Staff deleted');
      loadData();
    }
  };

  const handleToggleAvailable = (member: Staff) => {
    try {
      dbMock.saveStaff(shop.id, {
        ...member,
        is_available: !member.is_available
      });
      loadData();
      triggerToast(`${member.name} availability toggled!`);
    } catch (err) {
      triggerToast('Error saving changes');
    }
  };

  return (
    <div className="flex flex-col min-h-[580px] bg-[#F8FAFC] pb-20 relative overflow-y-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800 animate-slide-in">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          {toast.msg}
        </div>
      )}

      {/* 1. STAFF LIST SCREEN */}
      {screenMode === 'list' && (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mt-2">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">Our Staff (कर्मचारी सूची)</h2>
              <p className="text-xs text-[#64748B]">Manage stylists and check reviews</p>
            </div>
            <button
              onClick={() => onNavigateTo('staff_add_edit')}
              className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>

          <div className="space-y-3">
            {staff.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center flex flex-col items-center">
                <Users className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No staff registered</p>
                <p className="text-xs text-[#64748B] mt-0.5">Add staff members to assign tasks during bookings.</p>
              </div>
            ) : (
              staff.map(member => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col gap-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-11 h-11 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">{member.name}</h4>
                        <p className="text-[10px] text-[#64748B]">{member.role}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-0.5">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </span>
                          <span className="text-slate-200">•</span>
                          <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" />
                            {member.rating.toFixed(1)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {member.available_days?.map(day => (
                            <span key={day} className="text-[8px] font-bold bg-slate-100 text-slate-600 px-1 py-0.5 rounded-sm uppercase">
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Toggle Availability */}
                      <button
                        onClick={() => handleToggleAvailable(member)}
                        className="p-1 rounded text-slate-400 hover:text-[#64748B] transition-colors flex flex-col items-center"
                      >
                        {member.is_available ? (
                          <ToggleRight className="w-6 h-6 text-[#2563EB]" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-300" />
                        )}
                        <span className="text-[8px] font-bold mt-0.5">{member.is_available ? 'Active' : 'Inactive'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onNavigateTo('block_slot', member)}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold py-2 rounded-xl border border-amber-200 transition-colors flex items-center justify-center gap-1"
                    >
                      Block Time
                    </button>
                    <button
                      onClick={() => onNavigateTo('staff_add_edit', member)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold py-2 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold py-2 rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. ADD/EDIT STAFF SCREEN */}
      {screenMode === 'add_edit' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('profile')}
              className="p-1.5 bg-white border border-[#E2E8F0] rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-[#64748B]" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                {selectedStaffData ? 'Edit Staff Member' : 'Register Staff (नया स्टाफ जोड़ें)'}
              </h2>
              <p className="text-xs text-[#64748B]">Configure profile, phone, and available status</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Staff Full Name (कर्मचारी का नाम) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Staff Specialization / Role *
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Senior Hair Stylist, Beard Expert"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Mobile Number (मोबाइल नंबर) *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 99111 XXXXX"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>

              {/* Avatar Selector Gallery */}
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Choose Profile Avatar
                </label>
                <div className="flex gap-3">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80'
                  ].map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                        avatar === url ? 'border-[#2563EB] scale-105' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={url} alt="preset avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <input
                  type="checkbox"
                  id="staff-is-available"
                  checked={isAvailable}
                  onChange={e => setIsAvailable(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4"
                />
                <label htmlFor="staff-is-available" className="text-xs font-semibold text-[#64748B] cursor-pointer select-none">
                  Currently active & available for bookings today
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold py-3.5 rounded-xl shadow transition-colors"
              >
                Save Staff Member Details (सुरक्षित करें)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
