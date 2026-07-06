import { dbMock } from './dbMock';
import { supabase, isSupabaseConfigured, isValidUUID } from './supabase';

export interface SyncOperation {
  id: string;
  type: 'save_booking' | 'save_service' | 'delete_service' | 'save_staff' | 'delete_staff' | 'add_blocked_slot' | 'delete_blocked_slot' | 'update_booking_status' | 'save_customer' | 'save_shop' | 'delete_notification' | 'read_all_notifications' | 'mark_notification_read';
  shopId: string;
  payload: any;
  timestamp: string;
  description: string;
}

const QUEUE_KEY = 'nexora_pending_sync_queue';
const SIMULATED_OFFLINE_KEY = 'nexora_simulated_offline';

export const syncManager = {
  // Check if simulated offline or browser is offline
  isOffline: (): boolean => {
    if (typeof window === 'undefined') return false;
    const simulated = localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
    return simulated || !navigator.onLine;
  },

  // Set simulated offline state
  setSimulatedOffline: (offline: boolean) => {
    localStorage.setItem(SIMULATED_OFFLINE_KEY, String(offline));
    window.dispatchEvent(new CustomEvent('connection-status-changed', { detail: { isOffline: offline } }));
  },

  // Get current queue
  getQueue: (): SyncOperation[] => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Add operation to queue
  enqueue: (type: SyncOperation['type'], shopId: string, payload: any, description: string) => {
    const queue = syncManager.getQueue();
    const newOp: SyncOperation = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      shopId,
      payload,
      timestamp: new Date().toISOString(),
      description
    };
    queue.push(newOp);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('sync-queue-changed', { detail: { count: queue.length } }));
    return newOp;
  },

  // Clear operations from queue
  clearQueue: () => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('sync-queue-changed', { detail: { count: 0 } }));
  },

  // Remove single operation from queue
  dequeue: (id: string) => {
    const queue = syncManager.getQueue().filter(op => op.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('sync-queue-changed', { detail: { count: queue.length } }));
  },

  // Execute sync queue (push to Supabase)
  syncPendingChanges: async (shopId: string): Promise<number> => {
    if (!isValidUUID(shopId)) {
      // If it's a mock/offline shop, clear its queue immediately so it doesn't linger
      const remaining = syncManager.getQueue().filter(op => op.shopId !== shopId);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
      window.dispatchEvent(new CustomEvent('sync-queue-changed', { detail: { count: remaining.length } }));
      return 0;
    }

    if (syncManager.isOffline()) {
      throw new Error('Cannot sync while offline');
    }

    const queue = syncManager.getQueue().filter(op => op.shopId === shopId);
    if (queue.length === 0) return 0;

    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping sync.');
      return 0;
    }

    // Process each operation against Supabase
    for (const op of queue) {
      try {
        let error = null;
        if (op.type === 'save_booking' || op.type === 'update_booking_status') {
          const { error: err } = await supabase
            .from('bookings')
            .upsert({ ...op.payload, shop_id: op.shopId });
          error = err;
        } else if (op.type === 'save_service') {
          const { error: err } = await supabase
            .from('services')
            .upsert({ ...op.payload, shop_id: op.shopId });
          error = err;
        } else if (op.type === 'delete_service') {
          const { error: err } = await supabase
            .from('services')
            .delete()
            .eq('id', op.payload.id)
            .eq('shop_id', op.shopId);
          error = err;
        } else if (op.type === 'save_staff') {
          const { error: err } = await supabase
            .from('staff')
            .upsert({ ...op.payload, shop_id: op.shopId });
          error = err;
        } else if (op.type === 'delete_staff') {
          const { error: err } = await supabase
            .from('staff')
            .delete()
            .eq('id', op.payload.id)
            .eq('shop_id', op.shopId);
          error = err;
        } else if (op.type === 'add_blocked_slot') {
          const { error: err } = await supabase
            .from('blocked_time_slots')
            .insert({ ...op.payload, shop_id: op.shopId });
          error = err;
        } else if (op.type === 'delete_blocked_slot') {
          const { error: err } = await supabase
            .from('blocked_time_slots')
            .delete()
            .eq('id', op.payload.id)
            .eq('shop_id', op.shopId);
          error = err;
        } else if (op.type === 'save_customer') {
          const { error: err } = await supabase
            .from('customers')
            .upsert({ ...op.payload, shop_id: op.shopId });
          error = err;
        } else if (op.type === 'save_shop') {
          const { error: err } = await supabase
            .from('shops')
            .update(op.payload)
            .eq('id', op.shopId);
          error = err;
        } else if (op.type === 'delete_notification') {
          const { error: err } = await supabase
            .from('notifications')
            .delete()
            .eq('id', op.payload.id)
            .eq('shop_id', op.shopId);
          error = err;
        } else if (op.type === 'read_all_notifications') {
          const { error: err } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('shop_id', op.shopId);
          error = err;
        } else if (op.type === 'mark_notification_read') {
          const { error: err } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', op.payload.id)
            .eq('shop_id', op.shopId);
          error = err;
        }

        if (error) {
          console.error(`Sync failed for op ${op.id}:`, error);
          // We could keep it in queue if it's a transient error, 
          // but for now we'll just log it.
        }
      } catch (err) {
        console.error('Error syncing operation:', op, err);
      }
    }

    // Save a synchronization log notification
    dbMock.addNotification(shopId, {
      title: 'Cloud Database Synced',
      message: `Successfully synchronized ${queue.length} updates with Supabase production server!`,
      type: 'system'
    });

    // Clear queue after success
    const remaining = syncManager.getQueue().filter(op => op.shopId !== shopId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    
    window.dispatchEvent(new CustomEvent('sync-queue-changed', { detail: { count: remaining.length } }));
    window.dispatchEvent(new Event('bookings-changed'));

    return queue.length;
  },

  // Pull data from Supabase to refresh LocalStorage cache
  pullFromCloud: async (shopId: string) => {
    if (syncManager.isOffline() || !isSupabaseConfigured() || !isValidUUID(shopId)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;

      // Fetch all relevant data in parallel with strict shop_id filtering
      const [
        { data: bookings },
        { data: services },
        { data: staff },
        { data: customers },
        { data: blockedSlots },
        { data: notifications },
        { data: wallet },
        { data: reviews },
        { data: withdrawals },
        { data: transactions }
      ] = await Promise.all([
        supabase.from('bookings').select('*').eq('shop_id', shopId),
        supabase.from('services').select('*').eq('shop_id', shopId),
        supabase.from('staff').select('*').eq('shop_id', shopId),
        supabase.from('customers').select('*').eq('shop_id', shopId),
        supabase.from('blocked_time_slots').select('*').eq('shop_id', shopId),
        supabase.from('notifications').select('*').eq('shop_id', shopId),
        supabase.from('salon_wallets').select('*').eq('shop_id', shopId).single(),
        supabase.from('reviews').select('*').eq('shop_id', shopId),
        supabase.from('withdrawals').select('*').eq('shop_id', shopId),
        supabase.from('wallet_transactions').select('*').eq('shop_id', shopId)
      ]);

      // Seed dbMock cache with this data
      if (bookings) localStorage.setItem(`nexora_bookings`, JSON.stringify(bookings));
      if (services) localStorage.setItem(`nexora_services`, JSON.stringify(services));
      if (staff) localStorage.setItem(`nexora_staff`, JSON.stringify(staff));
      if (customers) localStorage.setItem(`nexora_customers`, JSON.stringify(customers));
      if (blockedSlots) localStorage.setItem(`nexora_blocked_slots`, JSON.stringify(blockedSlots));
      if (notifications) localStorage.setItem(`nexora_notifications`, JSON.stringify(notifications));
      
      // For wallets and reviews, we merge into the global lists or handle specifically
      if (wallet) {
        const wallets = JSON.parse(localStorage.getItem('nexora_wallets') || '[]');
        const idx = wallets.findIndex((w: any) => w.shop_id === shopId);
        if (idx > -1) wallets[idx] = wallet;
        else wallets.push(wallet);
        localStorage.setItem('nexora_wallets', JSON.stringify(wallets));
      }
      
      if (reviews) {
        const allReviews = JSON.parse(localStorage.getItem('nexora_reviews') || '[]');
        // Filter out old reviews for this shop and add new ones
        const filtered = allReviews.filter((r: any) => r.shop_id !== shopId);
        localStorage.setItem('nexora_reviews', JSON.stringify([...filtered, ...reviews]));
      }

      if (transactions) {
        const allTxs = JSON.parse(localStorage.getItem('nexora_transactions') || '[]');
        const filtered = allTxs.filter((t: any) => t.shop_id !== shopId);
        localStorage.setItem('nexora_transactions', JSON.stringify([...filtered, ...transactions]));
      }

      window.dispatchEvent(new Event('bookings-changed'));
      window.dispatchEvent(new Event('wallet-changed'));
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (err) {
      console.error('Error pulling from cloud:', err);
    }
  },

  // Realtime Subscriptions
  subscribeToChanges: (shopId: string) => {
    if (!isSupabaseConfigured() || !isValidUUID(shopId)) return () => {};

    const channel = supabase
      .channel(`shop-changes-${shopId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `shop_id=eq.${shopId}` },
        () => syncManager.pullFromCloud(shopId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `shop_id=eq.${shopId}` },
        () => syncManager.pullFromCloud(shopId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews', filter: `shop_id=eq.${shopId}` },
        () => syncManager.pullFromCloud(shopId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'salon_wallets', filter: `shop_id=eq.${shopId}` },
        () => syncManager.pullFromCloud(shopId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals', filter: `shop_id=eq.${shopId}` },
        () => syncManager.pullFromCloud(shopId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

// Register mutation hook to automatically enqueue operations
dbMock.setMutationHook((type, shopId, payload, description) => {
  // Always enqueue to ensure we have a record
  syncManager.enqueue(type as any, shopId, payload, description);
  
  // If online, try to sync immediately
  if (!syncManager.isOffline()) {
    syncManager.syncPendingChanges(shopId);
  }
});

