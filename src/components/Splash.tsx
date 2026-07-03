/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Sparkles, Scissors, Store } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-[580px] h-full bg-[#0F172A] text-white px-6 relative overflow-hidden">
      {/* Luxurious dark background overlays */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-10" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        {/* Nexora Owner logo matching the gorgeous black and gold aesthetic */}
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-b from-[#2c2214] to-[#110e0a] rounded-full flex items-center justify-center border-4 border-amber-400 shadow-2xl shadow-amber-950/40 relative">
            {/* 'N' element */}
            <span className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 absolute -top-1">N</span>
            {/* Scissor / salon details */}
            <Scissors className="w-6 h-6 text-amber-300 rotate-90 mt-5 absolute" />
          </div>
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute -top-2 -right-2 w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg border border-amber-300"
          >
            <Sparkles className="w-4 h-4 text-[#0F172A]" />
          </motion.div>
        </div>

        <motion.h1
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-3xl font-extrabold tracking-tight mt-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300"
        >
          NEXORA <span className="text-white">OWNER</span>
        </motion.h1>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 0.9 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-xs text-amber-100/80 font-semibold tracking-wider uppercase mt-1.5"
        >
          Your Salon. Your Brand. Your Success.
        </motion.p>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 0.95 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-sm text-slate-300 font-medium tracking-wide mt-4 text-center max-w-[280px]"
        >
          Manage bookings. Grow your salon.
        </motion.p>
      </motion.div>

      {/* Loading bar */}
      <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-12 overflow-hidden border border-slate-700/50">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
        />
      </div>

      <div className="absolute bottom-8 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium uppercase tracking-widest">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
        Nexora Secure Portal
      </div>
    </div>
  );
}
