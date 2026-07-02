/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Calendar,
  Users,
  Wallet as WalletIcon,
  User as UserIcon,
  Wifi,
  Battery,
  Signal,
  ArrowLeft,
  Smartphone
} from 'lucide-react';

import { dbMock } from './lib/dbMock';
import { Owner, Shop, ScreenType, Booking, Customer, Service, Staff } from './types';

// Modular Components
import Splash from './components/Splash';
import Auth from './components/Auth';
import ShopSelection from './components/ShopSelection';
import Dashboard from './components/Dashboard';
import Bookings from './components/Bookings';
import Customers from './components/Customers';
import Services from './components/Services';
import StaffList from './components/Staff';
import Wallet from './components/Wallet';
import Notifications from './components/Notifications';
import Profile from './components/Profile';

export default function App() {
  // Navigation & Authentication states
  const [screen, setScreen] = useState<ScreenType>('splash');
  const [owner, setOwner] = useState<Owner | null>(null);
  const [activeShop, setActiveShop] = useState<Shop | null>(null);

  // Extra context payloads
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Parse path: /owner-app/:shop_id
  const parsePathAndLoad = () => {
    const path = window.location.pathname;
    const match = path.match(/^\/owner-app\/([a-zA-Z0-9-_]+)/);

    // Get current logged-in owner
    const loggedOwner = dbMock.getLoggedInOwner();

    if (loggedOwner) {
      setOwner(loggedOwner);

      if (match && match[1]) {
        const targetShopId = match[1];
        const allShops = dbMock.getShopsForOwner(loggedOwner.id);
        const matchedShop = allShops.find(s => s.id === targetShopId);

        if (matchedShop) {
          dbMock.setActiveShopId(matchedShop.id);
          setActiveShop(matchedShop);
          setScreen('home');
        } else {
          // If the shop doesn't belong to the owner, show Screen 20: Unauthorized
          setScreen('unauthorized');
        }
      } else {
        // Generic route, look for last active shop or load shop selection
        const activeShopId = dbMock.getActiveShopId();
        const ownerShops = dbMock.getShopsForOwner(loggedOwner.id);

        if (activeShopId) {
          const matchedShop = ownerShops.find(s => s.id === activeShopId);
          if (matchedShop) {
            setActiveShop(matchedShop);
            setScreen('home');
            // update URL path to match route expectations
            window.history.replaceState({}, '', `/owner-app/${matchedShop.id}`);
            return;
          }
        }

        if (ownerShops.length === 1) {
          setActiveShop(ownerShops[0]);
          dbMock.setActiveShopId(ownerShops[0].id);
          setScreen('home');
          window.history.replaceState({}, '', `/owner-app/${ownerShops[0].id}`);
        } else {
          setScreen('shop_selection');
        }
      }
    } else {
      // Not logged in
      setScreen('login');
    }
  };

  useEffect(() => {
    // Initial loading simulation with splash screen
    const splashTimer = setTimeout(() => {
      parsePathAndLoad();
    }, 2200);

    // Watch for window popstate / path changes
    const handleLocationChange = () => {
      parsePathAndLoad();
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Set active shop context and update URL
  const handleSelectShop = (shopId: string) => {
    if (!owner) return;
    const shops = dbMock.getShopsForOwner(owner.id);
    const selected = shops.find(s => s.id === shopId);
    if (selected) {
      dbMock.setActiveShopId(selected.id);
      setActiveShop(selected);
      setScreen('home');
      window.history.pushState({}, '', `/owner-app/${selected.id}`);
    }
  };

  const handleLogout = () => {
    dbMock.setLoggedInOwner(null);
    setOwner(null);
    setActiveShop(null);
    setScreen('login');
    window.history.pushState({}, '', '/');
  };

  // Switch back to shop selection screen
  const handleSwitchShop = () => {
    setScreen('shop_selection');
    window.history.pushState({}, '', '/');
  };

  // Custom multi-screen navigation trigger
  const navigateTo = (targetScreen: string, extraData?: any) => {
    // Save extra data context
    if (targetScreen === 'booking_detail') {
      setSelectedBooking(extraData || null);
      setScreen('booking_detail');
    } else if (targetScreen === 'booking_add') {
      setScreen('booking_add');
    } else if (targetScreen === 'block_slot') {
      setScreen('block_slot');
    } else if (targetScreen === 'customer_detail') {
      setSelectedCustomer(extraData || null);
      setScreen('customer_detail');
    } else if (targetScreen === 'service_add_edit') {
      setSelectedService(extraData || null);
      setScreen('service_add_edit');
    } else if (targetScreen === 'staff_add_edit') {
      setSelectedStaff(extraData || null);
      setScreen('staff_add_edit');
    } else {
      setScreen(targetScreen as ScreenType);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-6 px-4 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Desktop Wrapper Phone Chassis Mockup */}
      <div className="w-full max-w-[420px] bg-slate-950 rounded-[44px] p-3.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] border-[6px] border-slate-800 relative overflow-hidden flex flex-col justify-between h-[840px]">
        {/* Notch & Camera Pill */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center gap-1.5 pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-slate-800" />
          <div className="w-8 h-1 bg-slate-800 rounded-full" />
        </div>

        {/* Smartphone Screen Content */}
        <div className="bg-slate-50 flex-1 rounded-[32px] overflow-hidden relative flex flex-col justify-between">
          {/* Simulated Physical Phone Status Bar */}
          <div className="bg-transparent px-6 pt-3 pb-1.5 flex justify-between items-center text-[10px] font-black text-slate-800/80 z-30 select-none">
            <span>03:37 PM</span>
            <div className="flex items-center gap-1">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-4 h-3 text-slate-800/90" />
            </div>
          </div>

          {/* Core App Screens Dynamic Rendering */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* 1. Splash Screen */}
                {screen === 'splash' && (
                  <Splash onComplete={parsePathAndLoad} />
                )}

                {/* 2 & 3. Authentication Screens (Login, Signup) */}
                {(screen === 'login' || screen === 'signup' || screen === 'unauthorized') && (
                  <Auth
                    mode={screen === 'unauthorized' ? 'unauthorized' : screen}
                    onAuthSuccess={(loggedOwner) => {
                      setOwner(loggedOwner);
                      parsePathAndLoad();
                    }}
                    onSwitchMode={(mode) => setScreen(mode)}
                    onClearSession={handleLogout}
                  />
                )}

                {/* 4. Shop Selection Screen */}
                {screen === 'shop_selection' && owner && (
                  <ShopSelection
                    owner={owner}
                    onSelectShop={handleSelectShop}
                  />
                )}

                {/* 5. Owner Home Dashboard */}
                {screen === 'home' && activeShop && (
                  <Dashboard
                    shop={activeShop}
                    onNavigateTo={navigateTo}
                  />
                )}

                {/* 6, 7, 8, 15. Bookings-related Screens */}
                {(screen === 'bookings' || screen === 'booking_detail' || screen === 'booking_add' || screen === 'block_slot') && activeShop && (
                  <Bookings
                    shop={activeShop}
                    screenMode={
                      screen === 'bookings' ? 'list' :
                      screen === 'booking_detail' ? 'detail' :
                      screen === 'booking_add' ? 'add' : 'block_slot'
                    }
                    selectedBookingData={selectedBooking}
                    onNavigateTo={navigateTo}
                  />
                )}

                {/* 9, 10. Customer-related Screens */}
                {(screen === 'customers' || screen === 'customer_detail') && activeShop && (
                  <Customers
                    shop={activeShop}
                    screenMode={screen === 'customers' ? 'list' : 'detail'}
                    selectedCustomerData={selectedCustomer}
                    onNavigateTo={navigateTo}
                  />
                )}

                {/* 11, 12. Service-related Screens */}
                {(screen === 'services' || screen === 'service_add_edit') && activeShop && (
                  <Services
                    shop={activeShop}
                    screenMode={screen === 'services' ? 'list' : 'add_edit'}
                    selectedServiceData={selectedService}
                    onNavigateTo={navigateTo}
                  />
                )}

                {/* 13, 14. Staff-related Screens */}
                {(screen === 'staff' || screen === 'staff_add_edit') && activeShop && (
                  <StaffList
                    shop={activeShop}
                    screenMode={screen === 'staff' ? 'list' : 'add_edit'}
                    selectedStaffData={selectedStaff}
                    onNavigateTo={navigateTo}
                  />
                )}

                {/* 16. Wallet & QR Screen */}
                {screen === 'wallet' && activeShop && (
                  <Wallet shop={activeShop} />
                )}

                {/* 17. Notifications Screen */}
                {screen === 'notifications' && activeShop && (
                  <Notifications shop={activeShop} onNavigateTo={navigateTo} />
                )}

                {/* 18, 19. Profile, Help & Support Screens */}
                {(screen === 'profile' || screen === 'help') && owner && activeShop && (
                  <Profile
                    owner={owner}
                    shop={activeShop}
                    screenMode={screen === 'profile' ? 'menu' : 'help'}
                    onNavigateTo={navigateTo}
                    onLogout={handleLogout}
                    onSwitchShop={handleSwitchShop}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* STICKY BOTTOM NAVIGATION BAR */}
          {/* Only render navigation if logged in and managing a shop */}
          {owner && activeShop && ['home', 'bookings', 'customers', 'wallet', 'profile', 'services', 'staff', 'help'].includes(screen) && (
            <div className="bg-white border-t border-slate-200/80 py-2.5 px-4 flex justify-between items-center z-40 select-none shadow-[0_-5px_15px_-3px_rgba(0,0,0,0.03)] rounded-b-[32px]">
              <button
                onClick={() => setScreen('home')}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                  screen === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[9px] font-bold">Home</span>
              </button>

              <button
                onClick={() => setScreen('bookings')}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                  screen === 'bookings' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[9px] font-bold">Bookings</span>
              </button>

              <button
                onClick={() => setScreen('customers')}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                  screen === 'customers' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[9px] font-bold">Customers</span>
              </button>

              <button
                onClick={() => setScreen('wallet')}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                  screen === 'wallet' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <WalletIcon className="w-5 h-5" />
                <span className="text-[9px] font-bold">Wallet</span>
              </button>

              <button
                onClick={() => setScreen('profile')}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                  ['profile', 'services', 'staff', 'help'].includes(screen) ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span className="text-[9px] font-bold">Profile</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Home Indicator bar */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-full z-50 pointer-events-none" />
      </div>

      {/* Decorative desktop ambient overlays */}
      <div className="absolute top-1/4 left-10 text-slate-500 max-w-xs space-y-3 pointer-events-none hidden xl:block">
        <div className="flex items-center gap-2 text-slate-300">
          <Smartphone className="w-6 h-6 text-blue-500" />
          <span className="font-extrabold tracking-wider uppercase text-xs">Nexora Owner PWA</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-400 font-medium">
          Simulating a premium native Android/iOS application on desktop. The layout is optimized mobile-first to ensure crisp alignment, readable cards, and fast performance.
        </p>
        <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-2xl text-[10px]">
          <span className="font-black block text-slate-300">DEMO OWNER ACCOUNTS:</span>
          <span className="font-semibold text-slate-400 block mt-1">Email: harmonymusicfilms@gmail.com</span>
          <span className="font-semibold text-slate-400 block">Password: any</span>
        </div>
      </div>
    </div>
  );
}
