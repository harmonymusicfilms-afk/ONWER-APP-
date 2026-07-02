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
    } else if (screenMode === 'add_edit') {
      setName('');
      setRole('Hair Stylist');
      setPhone('');
      setIsAvailable(true);
      setAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80');
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
        avatar
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
    <div className="flex flex-col min-h-[580px] bg-slate-50 pb-20 relative overflow-y-auto">
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
              <h2 className="text-xl font-bold text-slate-900">Our Staff (कर्मचारी सूची)</h2>
              <p className="text-xs text-slate-500">Manage stylists and check reviews</p>
            </div>
            <button
              onClick={() => onNavigateTo('staff_add_edit')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>

          <div className="space-y-3">
            {staff.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center">
                <Users className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No staff registered</p>
                <p className="text-xs text-slate-400 mt-0.5">Add staff members to assign tasks during bookings.</p>
              </div>
            ) : (
              staff.map(member => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex justify-between items-center hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-11 h-11 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{member.name}</h4>
                      <p className="text-[10px] text-slate-500">{member.role}</p>
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
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Toggle Availability */}
                    <button
                      onClick={() => handleToggleAvailable(member)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {member.is_available ? (
                        <ToggleRight className="w-7 h-7 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-300" />
                      )}
                    </button>

                    <button
                      onClick={() => onNavigateTo('staff_add_edit', member)}
                      className="p-1.5 bg-slate-50 rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-1.5 bg-red-50 rounded-lg text-red-500 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
              className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedStaffData ? 'Edit Staff Member' : 'Register Staff (नया स्टाफ जोड़ें)'}
              </h2>
              <p className="text-xs text-slate-500">Configure profile, phone, and available status</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Staff Full Name (कर्मचारी का नाम) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Staff Specialization / Role *
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Senior Hair Stylist, Beard Expert"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Mobile Number (मोबाइल नंबर) *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 99111 XXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Avatar Selector Gallery */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
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
                        avatar === url ? 'border-blue-600 scale-105' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={url} alt="preset avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="staff-is-available"
                  checked={isAvailable}
                  onChange={e => setIsAvailable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="staff-is-available" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Currently active & available for bookings today
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3.5 rounded-xl shadow transition-colors"
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
