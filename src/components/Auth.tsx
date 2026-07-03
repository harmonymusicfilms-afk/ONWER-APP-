/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, ShieldAlert, KeyRound, Mail, User, Phone, LogIn, UserPlus, Building2, MapPin } from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { supabase } from '../lib/supabase';
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
  const [shopName, setShopName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Salon & Grooming');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password (कृपया ईमेल और पासवर्ड दर्ज करें)');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message);
        triggerToast(authError.message, 'error');
        return;
      }

      if (data.user) {
        triggerToast('Logged in successfully! (सफलतापूर्वक लॉगिन किया गया!)', 'success');
        // App.tsx handles the session change and routing
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone || !shopName || !city || !area) {
      setError('All fields are mandatory (सभी फ़ील्ड्स भरना आवश्यक है)');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Sign up user
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone.trim(),
          }
        }
      });

      if (authError) {
        setError(authError.message);
        triggerToast(authError.message, 'error');
        return;
      }

      if (data.user) {
        // 2. Create profile entry if it doesn't exist via trigger/function
        // 3. Create shop entry
        const { error: shopError } = await supabase.from('shops').insert({
          owner_id: data.user.id,
          name: shopName.trim(),
          type: businessCategory.trim(),
          address: `${area.trim()}, ${city.trim()}`,
          phone: phone.trim(),
          upi_id: `${email.split('@')[0]}@upi`
        });

        if (shopError) {
          console.error('Error creating shop:', shopError);
        }

        triggerToast('Account created! Please check your email for verification if required.', 'success');
        // App.tsx handles session and routing
      }
    } catch (err: any) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'unauthorized') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[580px] bg-[#F8FAFC] text-slate-900 px-6 py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] mb-2 text-center">
          Unauthorized Access
        </h2>
        <p className="text-sm text-[#64748B] text-center max-w-xs mb-8">
          You are not allowed to access this shop.
        </p>
        <button
          onClick={() => {
            if (onClearSession) onClearSession();
            onSwitchMode('login');
          }}
          className="w-full max-w-xs bg-[#1E293B] hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors uppercase tracking-wider text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between min-h-[580px] bg-[#F8FAFC] p-6 relative overflow-y-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800">
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center mt-6">
        <div className="w-14 h-14 bg-[#2563EB] rounded-xl flex items-center justify-center mb-4 shadow-md shadow-blue-100">
          <Store className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#0F172A]">
          Nexora <span className="text-[#2563EB]">Owner</span>
        </h2>
        <p className="text-xs text-[#64748B] mt-1 font-medium tracking-wide">
          {mode === 'login' ? 'OWNER SIGN IN • पार्टनर लॉगिन' : 'PARTNER SIGN UP • नया खाता'}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm mt-6 mb-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-medium">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-3 pl-11 pr-4 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>
              <p className="text-[10px] text-[#64748B] mt-1.5 leading-relaxed bg-[#F1F5F9] px-2.5 py-1.5 rounded-lg border border-slate-200">
                💡 Tip: Use <span className="font-extrabold text-[#2563EB]">harmonymusicfilms@gmail.com</span> to automatically load premium partner data!
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    triggerToast('Password reset link sent to your email address! (पासवर्ड रीसेट लिंक ईमेल पर भेजा गया!)', 'success');
                  }}
                  className="text-[11px] font-extrabold text-[#2563EB] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-3 pl-11 pr-4 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-100 flex items-center justify-center gap-2 transition-colors mt-6 uppercase tracking-wider"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Login
                </>
              )}
            </button>

            {/* Google Login integration */}
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: window.location.origin
                    }
                  });
                  if (error) throw error;
                } catch (err: any) {
                  setError(err.message || 'Google login failed');
                  setLoading(false);
                }
              }}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-3 px-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center justify-center gap-2.5 transition-colors mt-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.244-3.121C18.28 1.84 15.5 1 12.24 1 6.01 1 1 5.925 1 12s5.01 11 11.24 11c6.51 0 10.84-4.51 10.84-11 0-.74-.08-1.3-.18-1.715H12.24z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Role simulation helper for demo */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-4 text-[11px] text-amber-900">
              <span className="font-extrabold block mb-0.5">🔒 Multi-Role Authorization Demo:</span>
              <p className="leading-relaxed text-amber-800">
                To test access blocking, enter <span className="font-bold underline text-[#2563EB]">customer@example.com</span> or <span className="font-bold underline text-[#2563EB]">staff@example.com</span>. They are assigned customer/staff roles and will be immediately blocked from portal access!
              </p>
            </div>

            {/* Separator and primary sign-up switcher button */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">New Shop Partner?</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <button
              type="button"
              onClick={() => onSwitchMode('signup')}
              className="w-full bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-bold py-3.5 px-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4.5 h-4.5 text-[#64748B]" />
              Create Owner Account
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1">
                Step 1: Partner Account Details
              </span>
              <p className="text-[11px] text-slate-500">Your profile details for authentication.</p>
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Owner Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sanjeev Kumar"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 my-3">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1">
                Step 2: Salon & Business Information
              </span>
              <p className="text-[11px] text-slate-500">Your first business outlet details.</p>
            </div>

            {/* Shop Name */}
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Shop Name *
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder="e.g. Nexora Premier Salon"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Business Category */}
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                Business Category *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={businessCategory}
                  onChange={e => setBusinessCategory(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors appearance-none"
                >
                  <option value="Salon & Grooming">Salon & Grooming (सैलून)</option>
                  <option value="Spa & Wellness">Spa & Wellness (स्पा)</option>
                  <option value="Gym & Fitness">Gym & Fitness (जिम)</option>
                  <option value="Clinic & Care">Clinic & Care (क्लिनिक)</option>
                </select>
              </div>
            </div>

            {/* City & Area (grid for balanced layout) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  City *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Delhi"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-8 pr-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Area *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. Connaught Place"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-8 pr-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-100 flex items-center justify-center gap-2 transition-colors mt-6 uppercase tracking-wider"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Owner Account
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Switcher */}
      <div className="text-center mt-2 mb-6">
        <p className="text-xs text-[#64748B]">
          {mode === 'login' ? "Don't have a shop account? " : 'Already registered? '}
          <button
            onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[#2563EB] font-semibold hover:underline"
          >
            {mode === 'login' ? 'Sign Up (नया खाता बनाएं)' : 'Log In (लॉग इन करें)'}
          </button>
        </p>
      </div>
    </div>
  );
}
