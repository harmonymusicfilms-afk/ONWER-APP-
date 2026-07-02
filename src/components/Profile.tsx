/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Store,
  Briefcase,
  Users,
  Ban,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldAlert,
  MessageSquare,
  FileQuestion,
  ChevronLeft,
  Mail,
  Smartphone
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { Owner, Shop, BlockedSlot } from '../types';

interface ProfileProps {
  owner: Owner;
  shop: Shop;
  screenMode: 'menu' | 'help';
  onNavigateTo: (screen: string) => void;
  onLogout: () => void;
  onSwitchShop: () => void;
}

export default function Profile({ owner, shop, screenMode, onNavigateTo, onLogout, onSwitchShop }: ProfileProps) {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  useEffect(() => {
    setBlockedSlots(dbMock.getBlockedSlots(shop.id));
  }, [shop.id]);

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
    <div className="flex flex-col min-h-[580px] bg-slate-50 pb-20 relative overflow-y-auto">
      {/* 1. PROFILE / SETTINGS MENU */}
      {screenMode === 'menu' && (
        <div className="p-4 space-y-4">
          {/* Owner details top card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex items-center gap-3.5 mt-2">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-extrabold text-base">
              {owner.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{owner.name}</h3>
              <p className="text-xs text-slate-500 font-semibold">{owner.email}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{owner.phone}</p>
            </div>
          </div>

          {/* Connected Outlet Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Active Managed Shop</span>
                <span className="text-xs font-bold text-slate-800">{shop.name}</span>
              </div>
            </div>
            <button
              onClick={onSwitchShop}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 py-1.5 px-3 rounded-lg"
            >
              Switch Shop
            </button>
          </div>

          {/* Navigation link blocks */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden divide-y divide-slate-100">
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
            <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Ban className="w-3.5 h-3.5" />
                Active Blocked Slots ({blockedSlots.length})
              </h4>

              <div className="space-y-2">
                {blockedSlots.map(slot => (
                  <div
                    key={slot.id}
                    className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-red-600 uppercase bg-red-50 px-1.5 py-0.2 rounded">
                        Blocked
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 mt-1">{slot.reason}</h5>
                      <p className="text-[9px] text-slate-500">
                        {slot.staff_name} • {slot.date} • {slot.start_time}-{slot.end_time}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveBlockedSlot(slot.id)}
                      className="text-[9px] font-bold text-red-600 bg-red-50 hover:bg-red-100 py-1 px-2 rounded-lg"
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
            className="w-full bg-slate-100 hover:bg-slate-200/80 text-red-600 text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-colors mt-2"
          >
            <LogOut className="w-4 h-4" />
            Logout from Nexora Owner (लॉग आउट करें)
          </button>
        </div>
      )}

      {/* 2. HELP & SUPPORT SCREEN */}
      {screenMode === 'help' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('profile')}
              className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Partner Help Desk (सहायता केंद्र)</h2>
              <p className="text-xs text-slate-500">Resolve app issues or raise ticket instantly</p>
            </div>
          </div>

          {/* FAQ Accordion list simulation */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileQuestion className="w-4 h-4 text-slate-400" />
              Frequently Asked Questions (FAQS)
            </h3>

            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              <div className="pt-2">
                <h4 className="font-bold text-slate-800">Q: How do I complete a booking?</h4>
                <p className="text-slate-600 mt-1">
                  A: Ask the client for the 4-digit code shown on their booking card. Tap the "Complete" button on your agenda, enter the code, and settle the payment.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-bold text-slate-800">Q: When do I get payout in my bank account?</h4>
                <p className="text-slate-600 mt-1">
                  A: Head to your Wallet screen, click on "Instant Bank Payout", select the payout amount, and click Settle. Funds will transfer immediately via IMPS.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-bold text-slate-800">Q: What is a blocked slot?</h4>
                <p className="text-slate-600 mt-1">
                  A: If a staff member is going on lunch or the shop is temporarily closed, block that slot from Profile &gt; Block Slots so clients can't book it.
                </p>
              </div>
            </div>
          </div>

          {/* Raise a Support ticket */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Submit Partner Ticket (टिकट दर्ज करें)
            </h3>

            <form onSubmit={handleSupportSubmit} className="space-y-3">
              <div>
                <textarea
                  value={supportMessage}
                  onChange={e => setSupportMessage(e.target.value)}
                  placeholder="Describe your issue or feature suggestion... (e.g., payout issue, change bank details, staff rating correction)"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!supportMessage.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs transition-colors"
              >
                {supportSubmitted ? 'Submitting ticket...' : 'Submit Support Query'}
              </button>
            </form>

            <div className="flex justify-around items-center pt-2 text-[10px] text-slate-400 font-bold border-t border-slate-100 uppercase">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                Call Desk: +91 1800-Nexora
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                desk@nexora.in
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
