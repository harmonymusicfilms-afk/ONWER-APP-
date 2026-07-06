import React from 'react';
import { motion } from 'motion/react';
import { Gift, Star, Award, TrendingUp, ArrowRight, Wallet } from 'lucide-react';
import { Shop } from '../types';

interface RewardsProps {
  shop: Shop;
  onNavigateTo: (screen: any) => void;
}

export const Rewards: React.FC<RewardsProps> = ({ shop, onNavigateTo }) => {
  const points = 450;
  const tier = 'Silver';
  const nextTierPoints = 1000;
  const progress = (points / nextTierPoints) * 100;

  const coupons = [
    { id: 1, title: '20% OFF on Facials', description: 'Applicable on O3+ and Gold facials', points: 200, icon: Gift, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 2, title: 'Free Hair Styling', description: 'Redeem on your 5th haircut', points: 500, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 3, title: '₹500 Wallet Credit', description: 'Get direct credit to your salon wallet', points: 1000, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="p-6 bg-white border-b border-[#E2E8F0]">
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Rewards</h1>
        <p className="text-sm text-[#64748B] font-medium">Earn points on every visit</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Points Card */}
        <div className="bg-[#0F172A] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Available Points</p>
                <h2 className="text-5xl font-black">{points}</h2>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <Award className="w-8 h-8 text-[#38BDF8]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{tier} Member</span>
                <span>{progress.toFixed(0)}% to Gold</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#38BDF8] to-[#818CF8]"
                />
              </div>
            </div>
          </div>
          
          {/* Decorative background circle */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#38BDF8] rounded-full blur-[80px] opacity-20" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-[#E2E8F0] shadow-sm">
            <TrendingUp className="w-5 h-5 text-[#2563EB] mb-2" />
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Saved this month</p>
            <p className="text-lg font-black text-[#0F172A]">₹1,240</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-[#E2E8F0] shadow-sm">
            <Award className="w-5 h-5 text-[#8B5CF6] mb-2" />
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Rank</p>
            <p className="text-lg font-black text-[#0F172A]">#12 / 240</p>
          </div>
        </div>

        {/* Available Coupons */}
        <div className="space-y-4 pb-4">
          <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest px-1">Redeem Coupons</h3>
          {coupons.map((coupon, idx) => (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-[2rem] border border-[#E2E8F0] shadow-sm flex items-center gap-4 group hover:border-[#2563EB] transition-colors"
            >
              <div className={`p-4 rounded-2xl ${coupon.bg} ${coupon.color}`}>
                <coupon.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-[#0F172A] text-sm">{coupon.title}</h4>
                <p className="text-xs text-[#64748B] font-medium leading-tight mt-0.5">{coupon.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-3 h-3 text-[#EAB308] fill-current" />
                  <span className="text-xs font-bold text-[#0F172A]">{coupon.points} pts</span>
                </div>
              </div>
              <button className="bg-[#F1F5F9] p-2 rounded-xl group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
