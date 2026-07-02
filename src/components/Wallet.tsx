/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  ShieldCheck,
  CreditCard,
  Building,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { WalletTransaction, Shop } from '../types';

interface WalletProps {
  shop: Shop;
}

export default function Wallet({ shop }: WalletProps) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Form states
  const [bankAccount, setBankAccount] = useState('SBI •••••• 4821');
  const [payoutAmount, setPayoutAmount] = useState('1000');
  const [payoutError, setPayoutError] = useState('');

  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const triggerToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const loadData = () => {
    setTransactions(dbMock.getTransactions(shop.id));
  };

  useEffect(() => {
    loadData();
  }, [shop.id]);

  // Calculations
  const creditTxs = transactions.filter(t => t.type === 'credit' && t.status === 'success');
  const debitTxs = transactions.filter(t => t.type === 'debit' && t.status === 'success');

  const upiCollected = creditTxs.filter(t => t.method === 'upi').reduce((sum, t) => sum + t.amount, 0);
  const cashCollected = creditTxs.filter(t => t.method === 'cash').reduce((sum, t) => sum + t.amount, 0);

  const totalPayouts = debitTxs.reduce((sum, t) => sum + t.amount, 0);

  // Calculate current available balance (total online upi credits minus payouts)
  // Cash stays at the physical counter, so online balance is UPI minus payouts
  const onlineBalance = Math.max(0, upiCollected - totalPayouts);

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payoutAmount);

    if (isNaN(amount) || amount <= 0) {
      setPayoutError('Enter a valid positive amount.');
      return;
    }

    if (amount > onlineBalance) {
      setPayoutError(`Insufficient UPI balance. Maximum withdrawable is ₹${onlineBalance}`);
      return;
    }

    setPayoutError('');
    setPayoutLoading(true);

    setTimeout(() => {
      try {
        // Record payout debit
        const txs = dbMock.getTransactionsRaw();
        txs.unshift({
          id: `tx-${Math.random().toString(36).substring(2, 7)}`,
          shop_id: shop.id,
          amount,
          type: 'debit',
          method: 'payout',
          status: 'success',
          description: `Bank Payout to ${bankAccount}`,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('nexora_transactions', JSON.stringify(txs));

        // Create alert notification
        dbMock.addNotification(shop.id, {
          title: 'Payout Disbursed',
          message: `₹${amount} transferred to Bank Account ${bankAccount}`,
          type: 'system'
        });

        triggerToast(`₹${amount} withdrawn successfully!`);
        setShowPayoutModal(false);
        loadData();
      } catch (err) {
        setPayoutError('Payout failed. Try again.');
      } finally {
        setPayoutLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-[580px] bg-slate-50 relative pb-20 overflow-y-auto p-4 space-y-4">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800 animate-slide-in">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mt-2">
        <h2 className="text-xl font-bold text-slate-900">Wallet & Settlement (बैलेंस और सेटलमेंट)</h2>
        <p className="text-xs text-slate-500">Track online earnings and instant payouts</p>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-850 text-white rounded-2xl p-5 shadow-lg border border-slate-850 relative overflow-hidden">
        {/* Background glow elements */}
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-35" />

        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Available for Bank Payout</span>
            <h3 className="text-2xl font-black mt-1">₹{onlineBalance}</h3>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Settle to {bankAccount}
            </p>
          </div>
          <span className="inline-block bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            UPI SETTLED
          </span>
        </div>

        <div className="flex gap-3 pt-5 border-t border-slate-800 mt-5">
          <button
            onClick={() => {
              if (onlineBalance <= 0) {
                triggerToast('No withdrawable balance available.');
                return;
              }
              setShowPayoutModal(true);
            }}
            className="flex-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold py-2.5 rounded-xl text-center shadow-xs transition-colors"
          >
            Instant Bank Payout
          </button>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Today UPI (ऑनलाइन)</span>
          <h4 className="text-lg font-extrabold text-slate-900 mt-1">₹{upiCollected}</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Scanned QR payments</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Today Cash (नकद)</span>
          <h4 className="text-lg font-extrabold text-slate-900 mt-1">₹{cashCollected}</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Direct hand-to-hand</p>
        </div>
      </div>

      {/* Transaction log */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Earnings Log ({transactions.length})</h3>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-500">No transactions recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200/60 shadow-xs flex justify-between items-center"
              >
                <div className="flex gap-3 items-center">
                  <div
                    className={`p-2 rounded-xl ${
                      tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{tx.description}</h4>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                      {tx.method} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-black block ${
                      tx.type === 'credit' ? 'text-emerald-700' : 'text-slate-800'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank Payout Modal Overlay */}
      {showPayoutModal && (
        <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm relative shadow-xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Building className="w-5 h-5 text-blue-600" />
              Instant Bank Settlement
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Disburse your online UPI collection directly into your registered bank account. Transfers are completed in real-time.
            </p>

            {payoutError && (
              <p className="text-xs text-red-600 font-medium mt-3 bg-red-50 p-2 rounded-lg border border-red-100 text-center">
                {payoutError}
              </p>
            )}

            <form onSubmit={handleRequestPayout} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Destination Bank Account
                </label>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>State Bank of India</span>
                  <span className="text-slate-900 font-mono">XXXX-XX-4821</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Withdrawal Amount (निकासी राशि) *
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  max={onlineBalance}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 font-black text-center text-xl py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayoutModal(false);
                    setPayoutError('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3 rounded-xl shadow transition-colors flex items-center justify-center gap-1"
                >
                  {payoutLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Settle Funds'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
