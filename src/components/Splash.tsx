/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Store, ShieldCheck, Sparkles } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[580px] h-full bg-slate-50 text-slate-900 px-6 relative overflow-hidden">
      {/* Decorative background grid elements */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-60" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-60" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="relative">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Store className="w-10 h-10 text-white" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center shadow"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </motion.div>
        </div>

        <motion.h1
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-3xl font-extrabold tracking-tight text-slate-900 mt-6"
        >
          Nexora <span className="text-blue-600">Owner</span>
        </motion.h1>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 0.8 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-sm text-slate-500 font-medium tracking-wide uppercase mt-2"
        >
          Shop Partner Portal
        </motion.p>
      </motion.div>

      {/* Loading bar */}
      <div className="w-48 h-1 bg-slate-200 rounded-full mt-16 overflow-hidden">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
          className="h-full bg-blue-600 rounded-full"
        />
      </div>

      <div className="absolute bottom-10 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        Secure Encrypted Connection
      </div>
    </div>
  );
}
