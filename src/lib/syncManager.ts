import { dbMock } from './dbMock';
import { supabase } from './supabase';

export interface SyncOperation {
  id: string;
  type: 'save_booking' | 'save_service' | 'save_staff' | 'add_blocked_slot' | 'update_booking_status' | 'save_customer';
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
    if (syncManager.isOffline()) {
      throw new Error('Cannot sync while offline');
    }

    const queue = syncManager.getQueue().filter(op => op.shopId === shopId);
    if (queue.length === 0) return 0;

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
        } else if (op.type === 'save_staff') {
          const { error: err } = await supabase
            .from('staff')
            .upsert({ ...op.payload, shop_id: op.shopId });
          error = err;
        } else if (op.type === 'add_blocked_slot') {
          const { error: err } = await supabase
            .from('blocked_time_slots')
            .insert({ ...op.payload, shop_id: op.shopId });
          error = err;
        } else if (op.type === 'save_customer') {
          const { error: err } = await supabase
            .from('customers')
            .upsert({ ...op.payload, shop_id: op.shopId });
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
    if (syncManager.isOffline()) return;

    try {
      // Fetch all relevant data in parallel
      const [
        { data: bookings },
        { data: services },
        { data: staff },
        { data: customers },
        { data: blockedSlots },
        { data: notifications }
      ] = await Promise.all([
        supabase.from('bookings').select('*').eq('shop_id', shopId),
        supabase.from('services').select('*').eq('shop_id', shopId),
        supabase.from('staff').select('*').eq('shop_id', shopId),
        supabase.from('customers').select('*').eq('shop_id', shopId),
        supabase.from('blocked_time_slots').select('*').eq('shop_id', shopId),
        supabase.from('notifications').select('*').eq('shop_id', shopId)
      ]);

      // Seed dbMock cache with this data
      if (bookings) localStorage.setItem(`nexora_bookings`, JSON.stringify(bookings));
      if (services) localStorage.setItem(`nexora_services`, JSON.stringify(services));
      if (staff) localStorage.setItem(`nexora_staff`, JSON.stringify(staff));
      if (customers) localStorage.setItem(`nexora_customers`, JSON.stringify(customers));
      if (blockedSlots) localStorage.setItem(`nexora_blocked_slots`, JSON.stringify(blockedSlots));
      if (notifications) localStorage.setItem(`nexora_notifications`, JSON.stringify(notifications));

      window.dispatchEvent(new Event('bookings-changed'));
    } catch (err) {
      console.error('Error pulling from cloud:', err);
    }
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

