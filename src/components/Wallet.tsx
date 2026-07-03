/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Wallet, 
  TrendingUp, 
  Clock, 
  Info, 
  ArrowUpRight, 
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { Shop, WalletTransaction, SalonWallet } from '../types';

interface WalletProps {
  shop: Shop;
  onNavigateTo: (screen: string) => void;
}

export default function WalletScreen({ shop, onNavigateTo }: WalletProps) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [wallet, setWallet] = useState<SalonWallet | null>(null);

  const loadData = () => {
    // Only fetch Nexora QR payments (simulated as method 'upi')
    const allTxs = dbMock.getTransactions(shop.id);
    const nexoraTxs = allTxs.filter(tx => tx.method === 'upi' || tx.method === 'payout');
    setTransactions(nexoraTxs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setWallet(dbMock.getWallet(shop.id));
  };

  useEffect(() => {
    loadData();
  }, [shop.id]);

  // Calculations for Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTxs = transactions.filter(tx => tx.created_at.startsWith(todayStr) && tx.type === 'credit');
  const todayCollection = todayTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const todayCommission = todayTxs.reduce((sum, tx) => sum + (tx.commission || 0), 0);
  const todayOwnerPayable = todayTxs.reduce((sum, tx) => sum + (tx.owner_amount || 0), 0);

  const stats = [
    {
      label: 'Today Collection',
      value: `₹${todayCollection}`,
      subLabel: 'आज की कुल ऑनलाइन वसूली',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      label: 'Nexora Commission',
      value: `₹${todayCommission}`,
      subLabel: 'नेक्सोरा कमीशन (10%)',
      icon: IndianRupee,
      color: 'red'
    },
    {
      label: 'Owner Payable',
      value: `₹${todayOwnerPayable}`,
      subLabel: 'मालिक को देय राशि',
      icon: ArrowUpRight,
      color: 'emerald'
    },
    {
      label: 'Pending Settlement',
      value: `₹${wallet?.pending_settlement || 0}`,
      subLabel: 'कुल लंबित भुगतान',
      icon: Clock,
      color: 'amber'
    },
    {
      label: 'Total Earned',
      value: `₹${wallet?.total_earned || 0}`,
      subLabel: 'अब तक की कुल कमाई',
      icon: CheckCircle2,
      color: 'indigo'
    },
    {
      label: 'Last Payout',
      value: `₹${wallet?.last_payout_amount || 0}`,
      subLabel: wallet?.last_payout_date ? `Last on ${wallet.last_payout_date}` : 'अंतिम भुगतान विवरण',
      icon: ArrowDownLeft,
      color: 'slate'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] p-4 flex items-center gap-3 sticky top-0 z-20">
        <button 
          onClick={() => onNavigateTo('home')}
          className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-[#2563EB] rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A]">E-Wallet (ई-वॉलेट)</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
        {/* Settlement Notice */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-blue-700 leading-relaxed">
            Daily settlement <span className="font-bold underline">10:00 PM</span> par process hota hai. Bank account mein aane mein 24 ghante tak lag sakte hain.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between min-h-[110px]"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-lg font-black text-[#0F172A]">{stat.value}</h3>
                <p className="text-[9px] font-bold text-[#94A3B8] mt-0.5">{stat.subLabel}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-slate-400" />
              Transaction History
            </h3>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {transactions.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock3 className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-400">No transactions found</p>
              </div>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {tx.type === 'credit' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">{tx.customer_name || 'System Payout'}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                          <Calendar className="w-3 h-3" />
                          {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-black ${tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                      </div>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>

                  {tx.type === 'credit' && (
                    <div className="bg-slate-50 rounded-xl p-2.5 mt-2 grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-[#94A3B8] uppercase">Commission (10%)</span>
                        <span className="text-[10px] font-bold text-red-500">₹{tx.commission}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[8px] font-bold text-[#94A3B8] uppercase">Owner Amount</span>
                        <span className="text-[10px] font-bold text-emerald-600">₹{tx.owner_amount}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
