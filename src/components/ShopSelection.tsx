/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, Plus, MapPin, Phone, Star, ArrowRight, X, Sparkles } from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { SHOP_CATEGORIES } from '../constants/categories';
import { Shop, Owner } from '../types';

interface ShopSelectionProps {
  owner: Owner;
  onSelectShop: (shopId: string) => void;
}

export default function ShopSelection({ owner, onSelectShop }: ShopSelectionProps) {
  const [shops, setShops] = useState<Shop[]>(dbMock.getShopsForOwner(owner.id));
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState(SHOP_CATEGORIES[2].value); // Default to 'Salon'
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [upi, setUpi] = useState('');
  const [error, setError] = useState('');

  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const triggerToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const handleAddShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !phone || !upi) {
      setError('All fields are mandatory (सभी फ़ील्ड भरना आवश्यक है)');
      return;
    }
    setError('');

    try {
      const newShop = dbMock.addShop(owner.id, {
        name,
        type,
        address,
        phone,
        upi_id: upi,
        rating: 5.0
      });

      // reload
      const updatedShops = dbMock.getShopsForOwner(owner.id);
      setShops(updatedShops);
      setIsAdding(false);

      // reset
      setName('');
      setAddress('');
      setPhone('');
      setUpi('');

      triggerToast('New shop added successfully! (नया आउटलेट जोड़ा गया!)');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-[580px] bg-[#F8FAFC] p-5 relative overflow-y-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800 animate-slide-in">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 mt-2">
        <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
          Hello, {owner.name} 👋
        </h2>
        <p className="text-sm text-[#64748B] mt-1">
          Select a shop to manage your daily operations.
        </p>
      </div>

      {/* Main Container */}
      {!isAdding ? (
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Your Outlets ({shops.length})
            </span>
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 bg-blue-50 py-1.5 px-3 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Shop (नया आउटलेट)
            </button>
          </div>

          {shops.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] p-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-3 border border-[#E2E8F0]">
                <Store className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-[#0F172A]">No outlets registered yet</p>
              <p className="text-xs text-[#64748B] mt-1 mb-4">Add your first business outlet to start taking bookings.</p>
              <button
                onClick={() => setIsAdding(true)}
                className="bg-[#2563EB] text-white text-xs font-semibold py-2 px-4 rounded-xl shadow transition-colors"
              >
                Add Your First Shop
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {shops.map(shop => {
                const addressParts = shop.address.split(',');
                const areaName = addressParts[0]?.trim() || shop.address;

                return (
                  <motion.div
                    key={shop.id}
                    whileHover={{ y: -1 }}
                    className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="inline-block text-[10px] font-bold bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded-full uppercase tracking-wider mb-2">
                          {shop.type}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {shop.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-[#0F172A]">{shop.name}</h3>

                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-[#64748B]">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                          <span className="font-semibold text-slate-700">Area:</span>
                          <span className="truncate">{areaName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#64748B]">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                          <span className="font-semibold text-slate-700">Address:</span>
                          <span className="truncate">{shop.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#64748B]">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                          <span className="font-semibold text-slate-700">Phone:</span>
                          <span>{shop.phone}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectShop(shop.id)}
                      className="w-full bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors mt-4 shadow-sm uppercase tracking-wider"
                    >
                      Open Shop
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 relative shadow-sm">
          <button
            onClick={() => setIsAdding(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            Add New Shop (नया आउटलेट)
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5 mb-4">
            Register another branch or setup a new wellness business.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleAddShop} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Shop Name (दुकान का नाम) *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Looks Hair Spa Noida"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Business Type (श्रेणी) *
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
              >
                {SHOP_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Address (पता) *
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Full address of the outlet"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Contact Phone (फ़ोन नंबर) *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                UPI ID for QR Payments (यूपीआई आईडी) *
              </label>
              <input
                type="text"
                value={upi}
                onChange={e => setUpi(e.target.value)}
                placeholder="e.g. looksnoida@okaxis"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Customer scans will transfer funds directly to this business account.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold py-3 rounded-xl shadow-md transition-colors"
              >
                Save Outlet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
