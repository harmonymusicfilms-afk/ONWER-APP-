/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, ShieldAlert, KeyRound, Mail, User, Phone, LogIn, UserPlus } from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { Owner } from '../types';

interface AuthProps {
  mode: 'login' | 'signup' | 'unauthorized';
  onAuthSuccess: (owner: Owner) => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onClearSession?: () => void;
}

export default function Auth({ mode, onAuthSuccess, onSwitchMode, onClearSession }: AuthProps) {
  // Common states
  const [email, setEmail] = useState('harmonymusicfilms@gmail.com');
  const [password, setPassword] = useState('password123'); // Simulated
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Success message toaster simulated state
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({
    show: false,
    msg: '',
    type: 'success'
  });

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email (कृपया अपना ईमेल दर्ज करें)');
      return;
    }
    setLoading(true);
    setError('');

    setTimeout(() => {
      // Simulate credential match
      // For testing, let Sanjeev Kumar log in with the preset email
      const allShops = dbMock.getShopsRaw();
      const existingOwner = dbMock.getLoggedInOwner();

      if (email.trim().toLowerCase() === 'harmonymusicfilms@gmail.com') {
        const owner: Owner = {
          id: 'owner-1',
          email: 'harmonymusicfilms@gmail.com',
          name: 'Sanjeev Kumar',
          phone: '+91 98765 43210'
        };
        dbMock.setLoggedInOwner(owner);
        // Find existing shop id or default to shop-1
        const ownerShops = dbMock.getShopsForOwner(owner.id);
        if (ownerShops.length > 0) {
          dbMock.setActiveShopId(ownerShops[0].id);
        } else {
          dbMock.setActiveShopId('shop-1');
        }
        triggerToast('Logged in successfully! (सफलतापूर्वक लॉगिन किया गया!)', 'success');
        onAuthSuccess(owner);
      } else {
        // Dynamic simulated sign-in for new emails
        const newOwner: Owner = {
          id: `owner-${Math.random().toString(36).substring(2, 7)}`,
          email: email.trim().toLowerCase(),
          name: email.split('@')[0],
          phone: '+91 90000 00000'
        };
        dbMock.setLoggedInOwner(newOwner);
        // Check if has shop, else create one
        const ownerShops = dbMock.getShopsForOwner(newOwner.id);
        if (ownerShops.length > 0) {
          dbMock.setActiveShopId(ownerShops[0].id);
        } else {
          // auto create
          const shop = dbMock.addShop(newOwner.id, {
            name: `${newOwner.name}'s Salon`,
            type: 'Salon & Grooming',
            address: 'Main Market, sector 5, Delhi',
            phone: newOwner.phone,
            rating: 5.0,
            upi_id: `${newOwner.id}@upi`
          });
          dbMock.setActiveShopId(shop.id);
        }
        triggerToast('Demo Login Successful!', 'success');
        onAuthSuccess(newOwner);
      }
      setLoading(false);
    }, 1000);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      setError('Please fill all mandatory fields (कृपया सभी आवश्यक फ़ील्ड भरें)');
      return;
    }
    setLoading(true);
    setError('');

    setTimeout(() => {
      try {
        const owner = dbMock.signup(email.trim(), name.trim(), phone.trim());
        triggerToast('Signup Completed Successfully! (पंजीकरण सफलतापूर्वक पूरा हुआ!)', 'success');
        onAuthSuccess(owner);
      } catch (err) {
        setError('Error creating account. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  if (mode === 'unauthorized') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[580px] bg-slate-50 text-slate-900 px-6 py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">
          Access Denied (पहुंच वर्जित)
        </h2>
        <p className="text-sm text-slate-500 text-center max-w-xs mb-8">
          You do not have permission to view this shop's dashboard. Please log in with the correct owner account.
        </p>
        <button
          onClick={() => {
            if (onClearSession) onClearSession();
            onSwitchMode('login');
          }}
          className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-colors"
        >
          Return to Sign In (लॉग इन करें)
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between min-h-[580px] bg-slate-50 p-6 relative overflow-y-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800">
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center mt-6">
        <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md shadow-blue-100">
          <Store className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Nexora <span className="text-blue-600">Owner</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
          {mode === 'login' ? 'OWNER SIGN IN • पार्टनर लॉगिन' : 'PARTNER SIGN UP • नया खाता'}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mt-6 mb-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-medium">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Email Address (ईमेल पता) *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Tip: Use <span className="font-semibold text-blue-600">harmonymusicfilms@gmail.com</span> for premium demo data!
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Password (पासवर्ड)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3.5 px-4 rounded-xl shadow-md shadow-blue-100 flex items-center justify-center gap-2 transition-colors mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In (लॉग इन करें)
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Full Name (पूरा नाम) *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sanjeev Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Email Address (ईमेल पता) *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Mobile Number (मोबाइल नंबर) *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3.5 px-4 rounded-xl shadow-md shadow-blue-100 flex items-center justify-center gap-2 transition-colors mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Sign Up & Create Shop (पंजीकरण करें)
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Switcher */}
      <div className="text-center mt-2 mb-6">
        <p className="text-xs text-slate-500">
          {mode === 'login' ? "Don't have a shop account? " : 'Already registered? '}
          <button
            onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-blue-600 font-semibold hover:underline"
          >
            {mode === 'login' ? 'Sign Up (नया खाता बनाएं)' : 'Log In (लॉग इन करें)'}
          </button>
        </p>
      </div>
    </div>
  );
}
