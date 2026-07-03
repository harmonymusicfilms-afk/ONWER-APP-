/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, User, Store, Briefcase, Users, Ban, Bell, HelpCircle, LogOut, ChevronRight, ShieldAlert, MessageSquare, MessageCircle, FileQuestion, ChevronLeft, Mail, Smartphone } from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { SHOP_CATEGORIES } from '../constants/categories';
import { uploadFile, STORAGE_BUCKETS, isSupabaseConfigured } from '../lib/supabase';
import { Owner, Shop, BlockedSlot } from '../types';

interface ProfileProps {
  owner: Owner;
  shop: Shop;
  screenMode: 'menu' | 'help' | 'edit_shop';
  onNavigateTo: (screen: string) => void;
  onLogout: () => void;
  onSwitchShop: () => void;
}

export default function Profile({ owner, shop, screenMode, onNavigateTo, onLogout, onSwitchShop }: ProfileProps) {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  // Edit Shop States
  const [editShopName, setEditShopName] = useState(shop.name);
  const [editShopPhone, setEditShopPhone] = useState(shop.phone || '');
  const [editShopAddress, setEditShopAddress] = useState(shop.address || '');
  const [editShopCity, setEditShopCity] = useState(shop.city || '');
  const [editShopArea, setEditShopArea] = useState(shop.area || '');
  const [editShopCategory, setEditShopCategory] = useState(shop.type || SHOP_CATEGORIES[2].value);
  const [editShopOpen, setEditShopOpen] = useState(shop.opening_time || '09:00 AM');
  const [editShopClose, setEditShopClose] = useState(shop.closing_time || '08:00 PM');
  const [shopLogo, setShopLogo] = useState(shop.logo_url || '');
  const [ownerAvatar, setOwnerAvatar] = useState(owner.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingOwner, setIsUploadingOwner] = useState(false);

  useEffect(() => {
    setBlockedSlots(dbMock.getBlockedSlots(shop.id));
  }, [shop.id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isSupabaseConfigured()) return;

    setIsUploading(true);
    try {
      const path = `${shop.id}/logo_${Date.now()}.${file.name.split('.').pop()}`;
      const url = await uploadFile(STORAGE_BUCKETS.LOGOS, path, file);
      setShopLogo(url);
      dbMock.saveShop(shop.id, { logo_url: url });
    } catch (err) {
      console.error('Logo upload failed:', err);
      alert('Failed to upload logo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOwnerAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isSupabaseConfigured()) return;

    setIsUploadingOwner(true);
    try {
      const path = `${owner.id}/profile_${Date.now()}.${file.name.split('.').pop()}`;
      const url = await uploadFile(STORAGE_BUCKETS.PROFILES, path, file);
      setOwnerAvatar(url);
      // Note: dbMock doesn't have saveOwner but we can simulate it if needed
      // For now we just update local state and assume it's saved in owner profile
    } catch (err) {
      console.error('Owner avatar upload failed:', err);
      alert('Failed to upload profile photo.');
    } finally {
      setIsUploadingOwner(false);
    }
  };

  const handleUpdateShop = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      dbMock.saveShop(shop.id, {
        name: editShopName,
        phone: editShopPhone,
        address: editShopAddress,
        city: editShopCity,
        area: editShopArea,
        type: editShopCategory,
        opening_time: editShopOpen,
        closing_time: editShopClose,
        logo_url: shopLogo
      });
      setTimeout(() => {
        setIsSaving(false);
        onNavigateTo('profile');
        alert('Shop details updated successfully! (दुकान का विवरण अपडेट कर दिया गया है!)');
      }, 800);
    } catch (err) {
      setIsSaving(false);
      alert('Error updating shop details.');
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportMessage('');
      setSupportSubmitted(false);
      alert('Support query submitted! Our partner desk will connect in 1 hour. (सपोर्ट टिकट दर्ज कर लिया गया है!)');
    }, 1500);
  };

  const handleRemoveBlockedSlot = (id: string) => {
    if (confirm('Release this blocked slot? (क्या आप इस स्लॉट को अनलॉक करना चाहते हैं?)')) {
      dbMock.deleteBlockedSlot(shop.id, id);
      setBlockedSlots(dbMock.getBlockedSlots(shop.id));
    }
  };

  return (
    <div className="flex flex-col min-h-[580px] bg-[#F8FAFC] pb-20 relative overflow-y-auto">
      {/* 1. PROFILE / SETTINGS MENU */}
      {screenMode === 'menu' && (
        <div className="p-4 space-y-4">
          {/* Owner details top card */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm flex items-center gap-3.5 mt-2">
            <div className="relative group">
              <div className="w-14 h-14 bg-[#0F172A] text-white rounded-2xl flex items-center justify-center font-extrabold text-lg overflow-hidden border-2 border-white shadow-sm">
                {ownerAvatar ? (
                  <img src={ownerAvatar} alt={owner.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  owner.name.charAt(0)
                )}
                {isUploadingOwner && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 p-1 bg-white border border-slate-100 rounded-lg shadow-md cursor-pointer hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100">
                <Camera className="w-3 h-3 text-slate-600" />
                <input type="file" className="hidden" accept="image/*" onChange={handleOwnerAvatarUpload} disabled={isUploadingOwner} />
              </label>
            </div>
            <div>
              <h3 className="text-base font-black text-[#0F172A]">{owner.name}</h3>
              <p className="text-xs text-[#64748B] font-semibold">{owner.email}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{owner.phone}</p>
            </div>
          </div>

          {/* Connected Outlet Box */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#2563EB] rounded-xl">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Active Managed Shop</span>
                  <span className="text-xs font-bold text-[#0F172A]">{shop.name}</span>
                </div>
              </div>
              <button
                onClick={onSwitchShop}
                className="text-[10px] font-bold text-[#2563EB] hover:text-blue-700 bg-blue-50 py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider"
              >
                Switch
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Category</span>
                <p className="text-[10px] font-bold text-[#0F172A]">{shop.type || 'Salon'}</p>
              </div>
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Location</span>
                <p className="text-[10px] font-bold text-[#0F172A]">{shop.area}, {shop.city}</p>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-[8px] font-bold text-slate-400 uppercase">Status:</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${shop.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {shop.is_active ? '● Open' : '○ Closed'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation link blocks */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden divide-y divide-slate-100">
            {/* Shop Basic Info */}
            <div
              onClick={() => onNavigateTo('edit_shop')}
              className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                  <ShieldAlert className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Shop Basic Info (दुकान की जानकारी)</h4>
                  <p className="text-[10px] text-slate-400">Update name, address, and timings</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Services Catalogs */}
            <div
              onClick={() => onNavigateTo('services')}
              className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                  <Briefcase className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Services Catalog (सेवाएं)</h4>
                  <p className="text-[10px] text-slate-400">Add, edit, or configure pricing</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Staff list */}
            <div
              onClick={() => onNavigateTo('staff')}
              className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Staff Members (कर्मचारी)</h4>
                  <p className="text-[10px] text-slate-400">Configure roles and check availability</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Block Slots Management */}
            <div
              onClick={() => onNavigateTo('block_slot')}
              className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                  <Ban className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Block Slots (ब्लॉक स्लॉट)</h4>
                  <p className="text-[10px] text-slate-400">Manage shop breaks and lock times</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Alerts & Notifications */}
            <div
              onClick={() => onNavigateTo('notifications')}
              className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Notifications Desk</h4>
                  <p className="text-[10px] text-slate-400">Read system messages and alarms</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Help & FAQs */}
            <div
              onClick={() => onNavigateTo('help')}
              className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Help & Support (सहायता)</h4>
                  <p className="text-[10px] text-slate-400">Get FAQs and talk to Nexora Desk</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Active Blocked Slots List block */}
          {blockedSlots.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                <Ban className="w-3.5 h-3.5" />
                Active Blocked Slots ({blockedSlots.length})
              </h4>

              <div className="space-y-2">
                {blockedSlots.map(slot => (
                  <div
                    key={slot.id}
                    className="flex justify-between items-center bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-100"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-red-600 uppercase bg-red-50 px-1.5 py-0.2 rounded">
                        Blocked
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 mt-1">{slot.reason}</h5>
                      <p className="text-[9px] text-[#64748B]">
                        {slot.staff_name} • {slot.date} • {slot.start_time}-{slot.end_time}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveBlockedSlot(slot.id)}
                      className="text-[9px] font-bold text-red-600 bg-red-50 hover:bg-red-100 py-1 px-2 rounded-lg transition-colors"
                    >
                      Unlock Slot
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log out section */}
          <button
            onClick={onLogout}
            className="w-full bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-colors mt-2 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout from Nexora Owner (लॉग आउट करें)
          </button>
        </div>
      )}

      {/* 3. EDIT SHOP INFO SCREEN */}
      {screenMode === 'edit_shop' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('profile')}
              className="p-1.5 bg-white border border-[#E2E8F0] rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Edit Shop Info</h2>
              <p className="text-xs text-[#64748B]">Update your business profile details</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-md flex items-center justify-center">
                  {shopLogo ? (
                    <img src={shopLogo} alt="Shop Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Store className="w-10 h-10 text-slate-300" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-[#2563EB] text-white rounded-xl shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                </label>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-wider">Shop Logo</p>
            </div>

            <form onSubmit={handleUpdateShop} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Shop Name *</label>
                  <input
                    type="text"
                    value={editShopName}
                    onChange={e => setEditShopName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Contact Number *</label>
                  <input
                    type="tel"
                    value={editShopPhone}
                    onChange={e => setEditShopPhone(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Full Address *</label>
                  <textarea
                    value={editShopAddress}
                    onChange={e => setEditShopAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">City *</label>
                    <input
                      type="text"
                      value={editShopCity}
                      onChange={e => setEditShopCity(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Area *</label>
                    <input
                      type="text"
                      value={editShopArea}
                      onChange={e => setEditShopArea(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Business Category *</label>
                  <select
                    value={editShopCategory}
                    onChange={e => setEditShopCategory(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  >
                    {SHOP_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Opening Time</label>
                    <input
                      type="text"
                      value={editShopOpen}
                      onChange={e => setEditShopOpen(e.target.value)}
                      placeholder="e.g. 09:00 AM"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">Closing Time</label>
                    <input
                      type="text"
                      value={editShopClose}
                      onChange={e => setEditShopClose(e.target.value)}
                      placeholder="e.g. 08:00 PM"
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-black py-4 rounded-2xl shadow-md transition-all active:scale-[0.98]"
                >
                  {isSaving ? 'Updating Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. HELP & SUPPORT SCREEN */}
      {screenMode === 'help' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('profile')}
              className="p-1.5 bg-white border border-[#E2E8F0] rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Help & Support (सहायता)</h2>
              <p className="text-xs text-[#64748B]">Get quick help and frequently asked questions</p>
            </div>
          </div>

          {/* Support Actions */}
          <div className="grid grid-cols-2 gap-3">
            <a 
              href={`https://wa.me/919876543210?text=Hi%20Nexora%20Support,%20I%20need%20help%20with%20my%20shop%20dashboard.`}
              target="_blank"
              rel="noreferrer"
              className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col items-center justify-center gap-2 hover:bg-green-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-700">WhatsApp Support</span>
            </a>
            <a 
              href="tel:+911800639672"
              className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-full flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-700">Call Support</span>
            </a>
          </div>

          {/* FAQ Accordion list */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
              <FileQuestion className="w-4 h-4 text-slate-400" />
              FAQ (सामान्य प्रश्न)
            </h3>

            <div className="space-y-3 divide-y divide-slate-100 text-xs text-left">
              <div className="pt-2">
                <h4 className="font-bold text-[#0F172A]">How to confirm booking?</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Go to the Bookings tab, find the pending request, and tap on "Confirm". The customer will receive an SMS confirmation.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-bold text-[#0F172A]">How to complete booking?</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Open the booking details and tap "Mark Completed". Enter the 4-digit OTP provided by the customer to settle the transaction.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-bold text-[#0F172A]">How settlement works?</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Earnings are credited to your Nexora Wallet instantly after booking completion. You can withdraw them to your bank account via the Wallet screen.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-bold text-[#0F172A]">How QR payment works?</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Show your dynamic QR code from the Wallet screen. When a customer pays, it updates your payment status automatically.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-bold text-[#0F172A]">How to block slot?</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Use the "Block Slot" option in the Bookings menu to mark specific hours as unavailable for new customer appointments.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
