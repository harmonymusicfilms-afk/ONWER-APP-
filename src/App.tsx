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
  WifiOff,
  Battery,
  Signal,
  ArrowLeft,
  Smartphone,
  BellRing,
  X,
  RefreshCw,
  Database,
  CloudLightning,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  Gift
} from 'lucide-react';

import { dbMock, seedOwners } from './lib/dbMock';
import { syncManager, SyncOperation } from './lib/syncManager';
import { supabase, isSupabaseConfigured, isValidUUID } from './lib/supabase';
import { Owner, Shop, ScreenType, Booking, Customer, Service, Staff, ChatThread } from './types';

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
import { ChatList } from './components/Chat/ChatList';
import { ChatDetail } from './components/Chat/ChatDetail';
import { Rewards } from './components/Rewards';

export default function App() {
  // Navigation & Authentication states
  const [screen, setScreen] = useState<ScreenType>('splash');
  const [owner, setOwner] = useState<Owner | null>(null);
  const [activeShop, setActiveShop] = useState<Shop | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [selectedChatThread, setSelectedChatThread] = useState<ChatThread | null>(null);

  // Supabase Auth Listener
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSessionLoading(false);
      setScreen('login');
      return;
    }

    let hasRouted = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' || (hasRouted && event !== 'SIGNED_OUT')) return;
      if (session?.user) {
        hasRouted = true;
        await handleRoleBasedRouting(session.user.id, session.user.email || '');
      } else {
        hasRouted = false;
        setOwner(null);
        setActiveShop(null);
        setSessionLoading(false);
        setScreen('login');
      }
    });

    // Safety net: never let the app hang forever waiting on auth/network
    const safetyTimer = setTimeout(() => {
      setSessionLoading((prev) => {
        if (prev) {
          console.warn('Auth check timed out after 8s — falling back to login.');
          setScreen('login');
        }
        return false;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [inAppToast, setInAppToast] = useState<{
    id: string;
    title: string;
    message: string;
    threadId: string;
    thread: ChatThread;
  } | null>(null);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playChime = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + duration);
      };
      
      playChime(ctx.currentTime, 523.25, 0.3); // C5
      playChime(ctx.currentTime + 0.12, 659.25, 0.4); // E5
    } catch (err) {
      console.warn('Audio play failed:', err);
    }
  };

  // Live Unread Count State
  useEffect(() => {
    if (!activeShop || !isValidUUID(activeShop.id)) {
      setUnreadChatCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const isOwner = owner?.role === 'shop_owner';
        const unreadField = isOwner ? 'owner_unread' : 'customer_unread';
        
        const { data, error } = await supabase
          .from('chat_threads')
          .select(unreadField)
          .eq('shop_id', activeShop.id);
        
        if (!error && data) {
          const count = data.reduce((sum, room) => sum + (room[unreadField] || 0), 0);
          setUnreadChatCount(count);
        }
      } catch (err) {
        console.error('Error fetching unread chat count in App:', err);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('app_chat_threads_unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_threads',
          filter: `shop_id=eq.${activeShop.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeShop]);

  // Global message listener for in-app / push notifications
  useEffect(() => {
    if (!activeShop || !isValidUUID(activeShop.id)) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const channel = supabase
      .channel('app_all_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          const newMsg = payload.new;
          if (newMsg.sender_role === 'customer') {
            const { data: thread } = await supabase
              .from('chat_threads')
              .select('*')
              .eq('id', newMsg.thread_id)
              .single();

            if (thread && thread.shop_id === activeShop.id) {
              const isInThisChat = screen === 'chat_detail' && selectedChatThread?.id === thread.id;
              if (!isInThisChat) {
                playNotificationSound();

                setInAppToast({
                  id: Math.random().toString(),
                  title: thread.customer_name || 'New Message',
                  message: newMsg.message || 'Sent an attachment',
                  threadId: thread.id,
                  thread: thread
                });

                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  new Notification(thread.customer_name || 'New Message', {
                    body: newMsg.message_text || 'Sent an attachment',
                    icon: activeShop.logo_url || undefined
                  });
                }
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeShop, screen, selectedChatThread]);

  useEffect(() => {
    if (inAppToast) {
      const timer = setTimeout(() => {
        setInAppToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [inAppToast]);

  const handleRoleBasedRouting = async (userId: string, email: string) => {
    try {
      // 1. Fetch Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 2. Fetch Role with exponential backoff retries
      let roleData = null;
      const MAX_ATTEMPTS = 4;
      const BASE_DELAY_MS = 350;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error(`Role fetch attempt ${attempt + 1} error:`, error.message);
        }

        if (data?.role) {
          roleData = data;
          break;
        }

        // Wait and retry
        await new Promise((resolve) =>
          setTimeout(resolve, BASE_DELAY_MS * Math.pow(2, attempt))
        );
      }

      if (profileError || !roleData) {
        // Fallback to mock data if it's the premium user
        if (email === 'harmonymusicfilms@gmail.com') {
          console.log('Using fallback mock data for premium user');
          const mockOwner = dbMock.getLoggedInOwner() || seedOwners[0];
          setOwner(mockOwner);
          dbMock.setLoggedInOwner(mockOwner);

          const mockShops = dbMock.getShopsForOwner(mockOwner.id);
          const savedShopId = dbMock.getActiveShopId();
          const targetShop = mockShops.find(s => s.id === savedShopId) || mockShops[0];

          if (targetShop) {
            setActiveShop(targetShop);
            dbMock.setActiveShopId(targetShop.id);
            setScreen('home');
          } else {
            // Owner has no shop yet — go to shop selection instead of a blank home
            setScreen('shop_selection');
          }
          setSessionLoading(false);
          return;
        }

        console.error('Error fetching role/profile after retries:', { profileError, roleData });
        setScreen('role_setup');
        setSessionLoading(false);
        return;
      }

      const role = roleData.role;

      // 2. ROLE ROUTING LOGIC
      if (role === 'customer' || role === 'shop_owner') {
        // Stay in app for both roles now
        console.log(`User logged in as ${role}`);
      } else if (role === 'super_admin') {
        window.location.href = 'https://nexora.in/admin-dashboard';
        return;
      } else if (role === 'partner') {
        window.location.href = 'https://nexora.in/partner-dashboard';
        return;
      } else if (role !== 'shop_owner') {
        setScreen('unauthorized');
        setSessionLoading(false);
        return;
      }

      // 3. User is shop_owner, prepare owner session object
      const ownerObj: Owner = {
        id: userId,
        email: email,
        name: profile?.full_name || email.split('@')[0],
        phone: profile?.phone || '',
        role: role || 'shop_owner'
      };
      setOwner(ownerObj);
      dbMock.setLoggedInOwner(ownerObj);

      // 4. Fetch Shops for this owner - Strict Validation: owner belongs to requested shop_id
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, owner_id, name, type, category, address, phone, rating, upi_id')
        .eq('owner_id', userId);

      if (shopsError) {
        console.error('Error fetching shops:', shopsError);
      }

      const ownerShops = (shops || []) as any[];

      // 5. URL Parameter Validation - Never rely only on URL parameters
      const path = window.location.pathname;
      const match = path.match(/^\/owner-app\/([a-zA-Z0-9-_]+)/);

      if (match && match[1]) {
        const targetShopId = match[1];
        // Validate: Does the authenticated user own the shop in the URL?
        const matchedShop = ownerShops.find(s => s.id === targetShopId);
        if (matchedShop) {
          // Shop ID in URL is valid and owned by this user
          setActiveShop(matchedShop);
          dbMock.setActiveShopId(matchedShop.id);
          setScreen('home');
        } else {
          // Attempted access to a shop not owned by the user
          console.warn(`Unauthorized access attempt to shop_id: ${targetShopId}`);
          setScreen('unauthorized');
        }
      } else if (ownerShops.length === 1) {
        // No shop in URL, but owner has exactly one shop - auto-select and route
        setActiveShop(ownerShops[0]);
        dbMock.setActiveShopId(ownerShops[0].id);
        setScreen('home');
        window.history.replaceState({}, '', `/owner-app/${ownerShops[0].id}`);
      } else {
        // Multiple shops or no shops - go to selection
        setScreen('shop_selection');
      }
    } catch (err) {
      console.error('Routing error:', err);
      setScreen('unauthorized');
    } finally {
      setSessionLoading(false);
    }
  };

  // Extra context payloads
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Push Notification Alert system states
  const [currentTime, setCurrentTime] = useState('');
  const [activeBanner, setActiveBanner] = useState<{
    id: string;
    booking: Booking;
    title: string;
    message: string;
  } | null>(null);

  // Offline Synchronization states
  const [isOffline, setIsOffline] = useState(syncManager.isOffline());
  const [pendingOps, setPendingOps] = useState<SyncOperation[]>(syncManager.getQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (activeShop) {
        handleTriggerSync(activeShop.id);
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleCustomStatusChange = (e: any) => {
      setIsOffline(e.detail.isOffline);
      if (!e.detail.isOffline && activeShop) {
        handleTriggerSync(activeShop.id);
      }
    };

    const handleQueueChange = () => {
      setPendingOps(syncManager.getQueue());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('connection-status-changed', handleCustomStatusChange);
    window.addEventListener('sync-queue-changed', handleQueueChange);

    // Initial check
    setIsOffline(syncManager.isOffline());
    setPendingOps(syncManager.getQueue());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connection-status-changed', handleCustomStatusChange);
      window.removeEventListener('sync-queue-changed', handleQueueChange);
    };
  }, [activeShop]);

  const handleTriggerSync = async (shopId: string) => {
    if (!isValidUUID(shopId)) {
      const remaining = syncManager.getQueue().filter(op => op.shopId !== shopId);
      localStorage.setItem('nexora_pending_sync_queue', JSON.stringify(remaining));
      window.dispatchEvent(new CustomEvent('sync-queue-changed', { detail: { count: remaining.length } }));
      return;
    }

    const queue = syncManager.getQueue().filter(op => op.shopId === shopId);
    if (queue.length === 0) return;

    setIsSyncing(true);
    setSyncStatusMsg(`Syncing ${queue.length} updates...`);
    try {
      const count = await syncManager.syncPendingChanges(shopId);
      setSyncStatusMsg(`Successfully synced ${count} updates!`);
      
      // Dynamic Toast banner
      setActiveBanner({
        id: 'sync-success',
        booking: {
          id: 'sync',
          shop_id: shopId,
          customer_name: 'Cloud Database Synced',
          customer_phone: '',
          service_id: '',
          service_name: 'Sync Complete',
          price: 0,
          staff_id: '',
          staff_name: '',
          date: '',
          time_slot: 'Cloud',
          status: 'confirmed',
          payment_status: 'paid_online'
        },
        title: 'Synchronization Success',
        message: `Successfully synchronized ${count} offline updates from local storage cache!`
      });
      playNotificationChime();
    } catch (err) {
      setSyncStatusMsg('Sync failed.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncStatusMsg('');
      }, 4000);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const playNotificationChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Tone 1: D5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);

      // Tone 2: A5
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.55);
    } catch (err) {
      console.warn('Audio chime error', err);
    }
  };

  useEffect(() => {
    if (!activeShop) return;

    // Skip real backend calls for the local mock/demo account
    const isMockShop = activeShop.id.startsWith('shop-') || !owner?.id?.includes('-');
    if (isMockShop) return;

    // Pull fresh data from cloud on shop select
    syncManager.pullFromCloud(activeShop.id);

    // Subscribe to realtime changes
    const unsubscribe = syncManager.subscribeToChanges(activeShop.id);

    const checkBookingsForAlerts = () => {
      try {
        const bookings = dbMock.getBookings(activeShop.id);
        const now = new Date();
        
        const alertedKey = `nexora_alerted_booking_ids_${activeShop.id}`;
        const alertedIdsRaw = localStorage.getItem(alertedKey);
        const alertedIds: string[] = alertedIdsRaw ? JSON.parse(alertedIdsRaw) : [];

        let changed = false;

        bookings.forEach(booking => {
          if (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show') return;
          if (alertedIds.includes(booking.id)) return;

          // Parse booking date and time
          const [hour, minute] = booking.time_slot.split(':').map(Number);
          const bookingDateTime = new Date(booking.date);
          bookingDateTime.setHours(hour, minute, 0, 0);

          const diffMs = bookingDateTime.getTime() - now.getTime();
          const diffMins = diffMs / (1000 * 60);

          // Alert if booking starts within the next 15 minutes
          if (diffMins > 0 && diffMins <= 15.5) {
            alertedIds.push(booking.id);
            changed = true;

            // Save in-app notification
            dbMock.addNotification(activeShop.id, {
              title: 'Upcoming Booking Reminder',
              message: `Booking for ${booking.customer_name} (${booking.service_name}) starts in 15 minutes at ${booking.time_slot}.`,
              type: 'system'
            });

            // Display in-app push alert banner
            setActiveBanner({
              id: booking.id,
              booking,
              title: 'Upcoming Booking Alert',
              message: `${booking.customer_name}'s booking for ${booking.service_name} starts in 15 minutes at ${booking.time_slot}!`
            });

            // Play notification sound
            playNotificationChime();

            // Trigger standard web notification if allowed
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Upcoming Booking Alert', {
                body: `${booking.customer_name}'s booking for ${booking.service_name} starts in 15 minutes at ${booking.time_slot}!`,
                icon: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&q=80'
              });
            }
          }
        });

        if (changed) {
          localStorage.setItem(alertedKey, JSON.stringify(alertedIds));
        }
      } catch (err) {
        console.warn('Alert checker error', err);
      }
    };

    checkBookingsForAlerts();
    const interval = setInterval(checkBookingsForAlerts, 10000);

    window.addEventListener('bookings-changed', checkBookingsForAlerts);

    return () => {
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('bookings-changed', checkBookingsForAlerts);
    };
  }, [activeShop]);

  // Parse path: /owner-app/:shop_id
  const parsePathAndLoad = () => {
    const path = window.location.pathname;
    const match = path.match(/^\/owner-app\/([a-zA-Z0-9-_]+)/);

    // Get current logged-in owner
    const loggedUser = dbMock.getLoggedInOwner();

    if (loggedUser) {
      // 1. ROLE ROUTING CHECK
      if (loggedUser.role !== 'shop_owner') {
        setScreen('unauthorized');
        return;
      }
      
      setOwner(loggedUser);

      // 2. ROUTER SECURITY: Verify shop ownership
      if (match && match[1]) {
        const targetShopId = match[1];
        const allShops = dbMock.getShopsForOwner(loggedUser.id);
        const matchedShop = allShops.find(s => s.id === targetShopId);

        if (matchedShop) {
          dbMock.setActiveShopId(matchedShop.id);
          setActiveShop(matchedShop);
          setScreen('home');
        } else {
          // If the shop does not belong to the logged-in owner, show Unauthorized
          // Never trust URL alone.
          setScreen('unauthorized');
        }
      } else {
        // Generic route or root, look for last active shop or load shop selection
        const activeShopId = dbMock.getActiveShopId();
        const ownerShops = dbMock.getShopsForOwner(loggedUser.id);

        if (activeShopId) {
          const matchedShop = ownerShops.find(s => s.id === activeShopId);
          if (matchedShop) {
            setActiveShop(matchedShop);
            setScreen('home');
            window.history.replaceState({}, '', `/owner-app/${matchedShop.id}`);
            return;
          }
        }

        if (ownerShops.length === 1) {
          setActiveShop(ownerShops[0]);
          dbMock.setActiveShopId(ownerShops[0].id);
          setScreen('home');
          window.history.replaceState({}, '', `/owner-app/${ownerShops[0].id}`);
        } else if (ownerShops.length > 1) {
          // 3. MULTI SHOP SAFETY: Show shop selector
          setScreen('shop_selection');
        } else {
          // No shops found for this owner? (Should not happen with normal signup)
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
      // If session is already loaded by onAuthStateChange, we don't need parsePathAndLoad
      if (!sessionLoading) {
        // parsePathAndLoad(); // We can remove this if we use Supabase session
      }
    }, 2200);

    return () => {
      clearTimeout(splashTimer);
    };
  }, [sessionLoading]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
      setSelectedBooking(extraData || null);
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
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center py-6 px-4 font-sans antialiased selection:bg-[#2563EB] selection:text-white">
      {/* Desktop Wrapper Phone Chassis Mockup */}
      <div className="w-full max-w-[412px] bg-[#F8FAFC] rounded-[48px] shadow-2xl border-[12px] border-[#1E293B] relative flex flex-col justify-between h-[732px] overflow-hidden">
        {/* Notch / Header Bar */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#E2E8F0] rounded-full z-50 pointer-events-none" />

        {/* Smartphone Screen Content */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden relative h-full">
          {/* Simulated Physical Phone Status Bar */}
          <div className="bg-transparent px-6 pt-5 pb-1.5 flex justify-between items-center text-[10px] font-black text-[#64748B] z-30 select-none">
            <span>{currentTime || '04:15 PM'}</span>
            <div className="flex items-center gap-1">
              <Signal className="w-3.5 h-3.5" />
              {isOffline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-[#64748B]" />
              )}
              <Battery className="w-4 h-3.5 text-[#64748B]/90" />
            </div>
          </div>

          {/* Interactive Network Sync Bar */}
          {owner && activeShop && (
            <div className="px-5 py-1.5 bg-white border-b border-[#E2E8F0] flex items-center justify-between text-[10px] z-30 select-none shrink-0">
              <button 
                onClick={() => setShowSyncPanel(!showSyncPanel)}
                className="flex items-center gap-1.5 font-extrabold cursor-pointer transition-opacity hover:opacity-80 text-left"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className={isOffline ? 'text-amber-700' : 'text-emerald-700'}>
                  {isOffline ? 'Offline Cache Active' : 'Cloud Connected'}
                </span>
                {pendingOps.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-bounce">
                    <AlertTriangle className="w-2 h-2" /> {pendingOps.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                  if (isOffline) {
                    syncManager.setSimulatedOffline(false);
                  } else {
                    handleTriggerSync(activeShop.id);
                  }
                }}
                disabled={isSyncing || (!isOffline && pendingOps.length === 0)}
                className="text-[#2563EB] font-black text-[9px] uppercase tracking-wider flex items-center gap-1 disabled:opacity-40 cursor-pointer transition-colors hover:text-blue-700"
              >
                {isSyncing ? (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                ) : isOffline ? (
                  'Go Online'
                ) : (
                  <>
                    <RefreshCw className="w-2.5 h-2.5" /> Sync ({pendingOps.length})
                  </>
                )}
              </button>
            </div>
          )}

          {/* Slide-down Offline Connection & Sync Control Center */}
          <AnimatePresence>
            {showSyncPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0F172A] text-white border-b border-slate-800 overflow-hidden z-40 relative shrink-0"
              >
                <div className="p-4 space-y-3.5 text-left">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-200">
                      <Database className="w-3.5 h-3.5 text-blue-400" />
                      <span>Connection & Storage Manager</span>
                    </div>
                    <button
                      onClick={() => setShowSyncPanel(false)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider">Simulated Network</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-[10px] font-black ${isOffline ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {isOffline ? 'OFFLINE' : 'ONLINE'}
                        </span>
                        <button
                          onClick={() => {
                            syncManager.setSimulatedOffline(!isOffline);
                          }}
                          className={`text-[8px] font-black px-2 py-1 rounded-md border uppercase transition-all ${
                            isOffline
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/80'
                              : 'bg-amber-950/40 text-amber-400 border-amber-900/50 hover:bg-amber-950/80'
                          }`}
                        >
                          {isOffline ? 'Connect' : 'Go Offline'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider">Sync Queue</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-white text-[10px] font-black">
                          {pendingOps.length} Updates
                        </span>
                        {pendingOps.length > 0 && !isOffline && (
                          <button
                            onClick={() => activeShop && handleTriggerSync(activeShop.id)}
                            disabled={isSyncing}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase"
                          >
                            Sync Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sync status messages if any */}
                  {syncStatusMsg && (
                    <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-blue-900/40 text-[9px] text-blue-300 font-extrabold flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                      <span>{syncStatusMsg}</span>
                    </div>
                  )}

                  {/* Operational logs */}
                  <div className="space-y-1.5">
                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider">Offline Sync Log</p>
                    {pendingOps.length === 0 ? (
                      <div className="bg-slate-900/50 p-2.5 rounded-xl text-[9px] text-slate-400 border border-slate-800/40 text-center py-2.5">
                        No pending offline changes. Ready for connection.
                      </div>
                    ) : (
                      <div className="max-h-20 overflow-y-auto space-y-1 pr-1 border border-slate-800/40 rounded-xl">
                        {pendingOps.map(op => (
                          <div key={op.id} className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60 text-[9px] flex justify-between items-center gap-2">
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-200 truncate">{op.description}</p>
                              <p className="text-[7px] text-slate-400">{new Date(op.timestamp).toLocaleTimeString()}</p>
                            </div>
                            <span className="bg-amber-950/40 text-amber-400 border border-amber-900/40 text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0">
                              Queued
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Informational Footer */}
                  <div className="bg-slate-900/30 border border-slate-800/50 p-2 rounded-xl text-[8px] text-slate-400 flex items-start gap-1.5 leading-relaxed font-sans">
                    <CloudLightning className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-300">Service Worker & LocalStorage</p>
                      <p className="text-[8px] text-slate-400 font-medium">All bookings and shop details are securely cached in LocalStorage, enabling complete viewing capability offline. Assets like fonts, styles, and Unsplash portraits are stored via Service Worker cache.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slide-down In-App Push Notification Banner */}
          <AnimatePresence>
            {activeBanner && (
              <motion.div
                initial={{ opacity: 0, y: -100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -100, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                onClick={() => {
                  navigateTo('booking_detail', activeBanner.booking);
                  setActiveBanner(null);
                }}
                className="absolute top-14 left-3 right-3 z-50 bg-[#0F172A] text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-start gap-3 cursor-pointer hover:bg-slate-900 transition-all select-none"
              >
                <div className="p-2 bg-[#2563EB] text-white rounded-xl animate-bounce shrink-0 mt-0.5">
                  <BellRing className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h5 className="text-[10px] font-black tracking-wider text-blue-400 uppercase">
                    {activeBanner.title}
                  </h5>
                  <p className="text-[11px] font-extrabold text-white mt-0.5 truncate">
                    {activeBanner.booking.customer_name} • {activeBanner.booking.time_slot}
                  </p>
                  <p className="text-[10px] font-medium text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                    {activeBanner.message}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveBanner(null);
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg self-center shrink-0 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </motion.div>
            )}

            {inAppToast && (
              <motion.div
                initial={{ opacity: 0, y: -100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -100, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                onClick={() => {
                  setSelectedChatThread(inAppToast.thread);
                  setScreen('chat_detail');
                  setInAppToast(null);
                }}
                className="absolute top-14 left-3 right-3 z-50 bg-white text-slate-800 p-3.5 rounded-2xl shadow-2xl border border-blue-100 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-all select-none"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                  {inAppToast.title.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-slate-900 truncate">
                      {inAppToast.title}
                    </h5>
                    <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Chat Msg
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 mt-0.5 truncate leading-relaxed">
                    {inAppToast.message}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChatThread(inAppToast.thread);
                        setScreen('chat_detail');
                        setInAppToast(null);
                      }}
                      className="bg-blue-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      Open Chat
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setInAppToast(null);
                      }}
                      className="bg-slate-100 text-slate-700 text-[9px] font-black px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInAppToast(null);
                  }}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg self-center shrink-0 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
                  <Splash onComplete={() => setScreen(prev => (prev === 'splash' ? 'login' : prev))} />
                )}

                {/* 2 & 3. Authentication Screens (Login, Signup) */}
                {(screen === 'login' || screen === 'signup' || screen === 'unauthorized') && (
                  <Auth
                    mode={screen === 'unauthorized' ? 'unauthorized' : screen}
                    onAuthSuccess={(loggedOwner) => {
                      if (loggedOwner.role !== 'shop_owner') {
                        setScreen('unauthorized');
                        return;
                      }
                      setOwner(loggedOwner);
                      parsePathAndLoad();
                    }}
                    onSwitchMode={(mode) => setScreen(mode)}
                    onClearSession={handleLogout}
                  />
                )}

                {/* Role Setup Screen */}
                {screen === 'role_setup' && (
                  <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                    <h2 className="text-xl font-black text-slate-800">Setting up your account...</h2>
                    <p className="text-sm text-slate-600 mt-2">We are finalizing your account profile. This usually takes a few seconds.</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-6 bg-[#2563EB] text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
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
                    owner={owner}
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
                  <Wallet shop={activeShop} onNavigateTo={navigateTo} />
                )}

                {/* 17. Notifications Screen */}
                {screen === 'notifications' && activeShop && (
                  <Notifications shop={activeShop} onNavigateTo={navigateTo} />
                )}

                {/* 18, 19. Profile, Help & Support Screens */}
                {(screen === 'profile' || screen === 'help' || screen === 'edit_shop') && owner && activeShop && (
                  <Profile
                    owner={owner}
                    shop={activeShop}
                    screenMode={
                      screen === 'profile' ? 'menu' : 
                      screen === 'help' ? 'help' : 'edit_shop'
                    }
                    onNavigateTo={navigateTo}
                    onLogout={handleLogout}
                    onSwitchShop={handleSwitchShop}
                  />
                )}

                {/* 20. Chat Screens */}
                {screen === 'chat_list' && activeShop && owner && (
                  <ChatList
                    shop={activeShop}
                    onBack={() => setScreen('home')}
                    onSelectThread={(thread) => {
                      setSelectedChatThread(thread);
                      setScreen('chat_detail');
                    }}
                    isShopOwner={owner.role === 'shop_owner'}
                  />
                )}

                {screen === 'chat_detail' && activeShop && selectedChatThread && (
                  <ChatDetail
                    thread={selectedChatThread}
                    shop={activeShop}
                    onBack={() => setScreen('chat_list')}
                    isShopOwner={owner.role === 'shop_owner'}
                  />
                )}

                {screen === 'rewards' && activeShop && (
                  <Rewards shop={activeShop} onNavigateTo={navigateTo} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* STICKY BOTTOM NAVIGATION BAR */}
          {/* Only render navigation if logged in and managing a shop */}
          {owner && activeShop && ['home', 'bookings', 'customers', 'wallet', 'profile', 'services', 'staff', 'help', 'chat_list', 'rewards'].includes(screen) && (
            <div className="h-20 bg-white border-t border-[#E2E8F0] flex items-center justify-between px-8 pb-4 z-40 select-none relative">
              <button
                onClick={() => setScreen('home')}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                  screen === 'home' ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[10px] font-bold">Home</span>
              </button>

              <button
                onClick={() => setScreen('bookings')}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                  screen === 'bookings' ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] font-bold">Bookings</span>
              </button>

              {owner.role === 'shop_owner' && (
                <button
                  onClick={() => setScreen('customers')}
                  className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                    screen === 'customers' ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Customers</span>
                </button>
              )}

              <button
                onClick={() => setScreen('chat_list')}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors relative ${
                  screen === 'chat_list' || screen === 'chat_detail' ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <div className="relative">
                  <MessageCircle className="w-5 h-5" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-white animate-pulse">
                      {unreadChatCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold">Chat</span>
              </button>

              {owner.role === 'shop_owner' ? (
                <button
                  onClick={() => setScreen('wallet')}
                  className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                    screen === 'wallet' ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <WalletIcon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Wallet</span>
                </button>
              ) : (
                <button
                  onClick={() => setScreen('rewards')}
                  className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                    screen === 'rewards' ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Gift className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Rewards</span>
                </button>
              )}

              <button
                onClick={() => setScreen('profile')}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                  ['profile', 'services', 'staff', 'help'].includes(screen) ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span className="text-[10px] font-bold">Profile</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Home Indicator bar */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-[#0F172A] rounded-full z-50 pointer-events-none" />
      </div>

      {/* Decorative desktop ambient overlays */}
      <div className="absolute top-1/4 left-10 text-[#64748B] max-w-xs space-y-3 pointer-events-none hidden xl:block">
        <div className="flex items-center gap-2 text-[#0F172A]">
          <Smartphone className="w-6 h-6 text-[#2563EB]" />
          <span className="font-extrabold tracking-wider uppercase text-xs">Nexora Owner PWA</span>
        </div>
        <p className="text-xs leading-relaxed text-[#64748B] font-medium">
          Simulating a premium native Android/iOS application on desktop. The layout is optimized mobile-first to ensure crisp alignment, readable cards, and fast performance.
        </p>
        <div className="bg-white border border-[#E2E8F0] p-3 rounded-2xl text-[10px] shadow-sm">
          <span className="font-black block text-[#0F172A]">DEMO OWNER ACCOUNTS:</span>
          <span className="font-semibold text-[#64748B] block mt-1">Email: harmonymusicfilms@gmail.com</span>
          <span className="font-semibold text-[#64748B] block">Password: any</span>
        </div>
      </div>
    </div>
  );
}
