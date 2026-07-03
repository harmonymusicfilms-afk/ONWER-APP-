/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Owner,
  Shop,
  Service,
  Staff,
  Booking,
  Customer,
  BlockedSlot,
  WalletTransaction,
  AppNotification,
  Review,
  SalonWallet
} from '../types';

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substring(2, 11);

// Key names for LocalStorage
const KEYS = {
  OWNER: 'nexora_owner',
  SHOPS: 'nexora_shops',
  SERVICES: 'nexora_services',
  STAFF: 'nexora_staff',
  BOOKINGS: 'nexora_bookings',
  CUSTOMERS: 'nexora_customers',
  BLOCKED_SLOTS: 'nexora_blocked_slots',
  TRANSACTIONS: 'nexora_transactions',
  NOTIFICATIONS: 'nexora_notifications',
  ACTIVE_SHOP_ID: 'nexora_active_shop_id',
  WALLETS: 'nexora_wallets',
  REVIEWS: 'nexora_reviews'
};

// Initial Data Seeds
const seedOwners: Owner[] = [
  {
    id: 'owner-1',
    email: 'harmonymusicfilms@gmail.com',
    name: 'Sanjeev Kumar',
    phone: '+91 98765 43210',
    role: 'shop_owner'
  }
];

const seedShops: Shop[] = [
  {
    id: 'shop-1',
    owner_id: 'owner-1',
    name: 'Looks Luxury Salon',
    type: 'Salon',
    category: 'Premium Unisex Salon',
    address: 'Block C, Sector 62, Noida, UP - 201301',
    city: 'Noida',
    area: 'Sector 62',
    phone: '+91 98123 45678',
    rating: 4.8,
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=looksowner@oksbi%26pn=Looks%20Luxury%20Salon%26am=0%26cu=INR',
    upi_id: 'looksowner@oksbi',
    opening_time: '09:00 AM',
    closing_time: '09:00 PM',
    is_active: true
  },
  {
    id: 'shop-2',
    owner_id: 'owner-1',
    name: 'Rejuvenate Wellness Spa',
    type: 'Spa',
    category: 'Luxury Wellness Center',
    address: 'DLF Phase 3, Sector 24, Gurugram, Haryana - 122002',
    city: 'Gurugram',
    area: 'DLF Phase 3',
    phone: '+91 98234 56789',
    rating: 4.9,
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=rejuvenatespa@okaxis%26pn=Rejuvenate%20Spa%26am=0%26cu=INR',
    upi_id: 'rejuvenatespa@okaxis',
    opening_time: '10:00 AM',
    closing_time: '10:00 PM',
    is_active: true
  }
];

const seedServices: Service[] = [
  // Shop 1 (Salon)
  { id: 'srv-1', shop_id: 'shop-1', name: 'Classic Haircut & Styling', duration_mins: 45, price: 350, category: 'Hair', is_active: true },
  { id: 'srv-2', shop_id: 'shop-1', name: 'Beard Grooming & Trim', duration_mins: 20, price: 150, category: 'Beard', is_active: true },
  { id: 'srv-3', shop_id: 'shop-1', name: 'O3+ Facial Treatment', duration_mins: 60, price: 1200, category: 'Facial', is_active: true },
  { id: 'srv-4', shop_id: 'shop-1', name: 'Hair Color (L\'Oreal)', duration_mins: 90, price: 1500, category: 'Hair', is_active: true },
  { id: 'srv-5', shop_id: 'shop-1', name: 'Pedicure & Foot Massage', duration_mins: 45, price: 600, category: 'Nails', is_active: true },
  // Shop 2 (Spa)
  { id: 'srv-6', shop_id: 'shop-2', name: 'Swedish Full Body Massage', duration_mins: 60, price: 2000, category: 'Massage', is_active: true },
  { id: 'srv-7', shop_id: 'shop-2', name: 'Deep Tissue Therapy', duration_mins: 90, price: 2800, category: 'Massage', is_active: true },
  { id: 'srv-8', shop_id: 'shop-2', name: 'Aromatherapy Session', duration_mins: 60, price: 2400, category: 'Therapy', is_active: true }
];

const seedStaff: Staff[] = [
  // Shop 1 (Salon)
  { id: 'stf-1', shop_id: 'shop-1', name: 'Amit Kumar', role: 'Senior Hair Stylist', phone: '+91 99111 22233', rating: 4.9, is_available: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80' },
  { id: 'stf-2', shop_id: 'shop-1', name: 'Rahul Sharma', role: 'Beard Specialist', phone: '+91 99222 33344', rating: 4.7, is_available: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80' },
  { id: 'stf-3', shop_id: 'shop-1', name: 'Pooja Verma', role: 'Skin & Facial Therapist', phone: '+91 99333 44455', rating: 4.8, is_available: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80' },
  // Shop 2 (Spa)
  { id: 'stf-4', shop_id: 'shop-2', name: 'Maya Sen', role: 'Master Masseur', phone: '+91 99444 55566', rating: 4.9, is_available: true, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80' },
  { id: 'stf-5', shop_id: 'shop-2', name: 'David Gomes', role: 'Therapy Expert', phone: '+91 99555 66677', rating: 4.6, is_available: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80' }
];

const seedCustomers: Customer[] = [
  { id: 'cust-1', shop_id: 'shop-1', name: 'Rohan Sharma', phone: '+91 98989 12345', email: 'rohan.sharma@gmail.com', total_bookings: 8, total_spent: 3100, last_visit_date: '2026-06-28', notes: 'Prefers tea. Always books Amit.' },
  { id: 'cust-2', shop_id: 'shop-1', name: 'Ananya Roy', phone: '+91 98888 23456', email: 'ananya.roy@yahoo.com', total_bookings: 3, total_spent: 3600, last_visit_date: '2026-06-30', notes: 'Sensitive skin. Prefers Pooja.' },
  { id: 'cust-3', shop_id: 'shop-1', name: 'Vikram Singh', phone: '+91 98777 34567', email: 'vikram.singh@gmail.com', total_bookings: 2, total_spent: 300, last_visit_date: '2026-07-01', notes: 'Quick haircuts only.' },
  { id: 'cust-4', shop_id: 'shop-2', name: 'Priya Sen', phone: '+91 98666 45678', email: 'priya.sen@outlook.com', total_bookings: 12, total_spent: 24000, last_visit_date: '2026-06-25', notes: 'Prefers Maya, warm herbal tea.' },
  { id: 'cust-5', shop_id: 'shop-1', name: 'Arjun Mehra', phone: '+91 99999 88888', total_bookings: 15, total_spent: 7500, last_visit_date: '2026-07-02', notes: 'VIP client' },
  { id: 'cust-6', shop_id: 'shop-1', name: 'Karan Johar', phone: '+91 99123 00000', total_bookings: 1, total_spent: 1500, last_visit_date: '2026-07-02', notes: 'New high spender' }
];

// Dynamically generate dates relative to "today" (2026-07-02)
const seedBookings: Booking[] = [
  {
    id: 'b-1',
    shop_id: 'shop-1',
    customer_name: 'Rohan Sharma',
    customer_phone: '+91 98989 12345',
    customer_id: 'cust-1',
    service_id: 'srv-1',
    service_name: 'Classic Haircut & Styling',
    price: 350,
    staff_id: 'stf-1',
    staff_name: 'Amit Kumar',
    date: '2026-07-02',
    time_slot: '10:00',
    status: 'completed',
    payment_status: 'paid_online',
    payment_method: 'upi',
    otp_code: '4821',
    notes: 'Regular customer',
    created_at: '2026-07-01T14:30:00Z'
  },
  {
    id: 'b-2',
    shop_id: 'shop-1',
    customer_name: 'Ananya Roy',
    customer_phone: '+91 98888 23456',
    customer_id: 'cust-2',
    service_id: 'srv-3',
    service_name: 'O3+ Facial Treatment',
    price: 1200,
    staff_id: 'stf-3',
    staff_name: 'Pooja Verma',
    date: '2026-07-02',
    time_slot: '12:30',
    status: 'confirmed',
    payment_status: 'unpaid',
    otp_code: '1905',
    notes: 'O3+ kit check',
    created_at: '2026-07-01T15:20:00Z'
  },
  {
    id: 'b-3',
    shop_id: 'shop-1',
    customer_name: 'Vikram Singh',
    customer_phone: '+91 98777 34567',
    customer_id: 'cust-3',
    service_id: 'srv-2',
    service_name: 'Beard Grooming & Trim',
    price: 150,
    staff_id: 'stf-2',
    staff_name: 'Rahul Sharma',
    date: '2026-07-02',
    time_slot: '14:00',
    status: 'pending',
    payment_status: 'unpaid',
    otp_code: '8392',
    notes: 'Wants sharp lines',
    created_at: '2026-07-02T09:15:00Z'
  },
  {
    id: 'b-4',
    shop_id: 'shop-1',
    customer_name: 'Arjun Mehra',
    customer_phone: '+91 99999 88888',
    service_id: 'srv-1',
    service_name: 'Classic Haircut & Styling',
    price: 350,
    staff_id: 'stf-1',
    staff_name: 'Amit Kumar',
    date: '2026-07-02',
    time_slot: '16:30',
    status: 'confirmed',
    payment_status: 'unpaid',
    otp_code: '5561',
    notes: 'Walk-in booking',
    created_at: '2026-07-02T11:00:00Z'
  },
  {
    id: 'b-5',
    shop_id: 'shop-1',
    customer_name: 'Karan Johar',
    customer_phone: '+91 99123 00000',
    service_id: 'srv-4',
    service_name: 'Hair Color (L\'Oreal)',
    price: 1500,
    staff_id: 'stf-1',
    staff_name: 'Amit Kumar',
    date: '2026-07-03',
    time_slot: '11:00',
    status: 'confirmed',
    payment_status: 'unpaid',
    otp_code: '9104',
    created_at: '2026-07-02T12:00:00Z'
  },
  {
    id: 'b-6',
    shop_id: 'shop-2',
    customer_name: 'Priya Sen',
    customer_phone: '+91 98666 45678',
    customer_id: 'cust-4',
    service_id: 'srv-6',
    service_name: 'Swedish Full Body Massage',
    price: 2000,
    staff_id: 'stf-4',
    staff_name: 'Maya Sen',
    date: '2026-07-02',
    time_slot: '15:00',
    status: 'confirmed',
    payment_status: 'paid_online',
    payment_method: 'upi',
    otp_code: '2281',
    created_at: '2026-07-01T10:00:00Z'
  }
];

const seedBlockedSlots: BlockedSlot[] = [
  {
    id: 'blk-1',
    shop_id: 'shop-1',
    staff_id: 'stf-2',
    staff_name: 'Rahul Sharma',
    date: '2026-07-02',
    start_time: '11:00',
    end_time: '12:00',
    reason: 'Lunch break',
    is_active: true,
    created_by: 'owner-1',
    created_at: '2026-07-02T09:00:00Z'
  }
];

const seedTransactions: WalletTransaction[] = [
  { id: 'tx-1', shop_id: 'shop-1', amount: 350, commission: 35, owner_amount: 315, type: 'credit', method: 'upi', status: 'success', booking_id: 'b-1', customer_name: 'Rohan Sharma', description: 'Classic Haircut - Rohan Sharma', created_at: '2026-07-02T10:45:00Z' },
  { id: 'tx-2', shop_id: 'shop-1', amount: 1500, commission: 150, owner_amount: 1350, type: 'credit', method: 'upi', status: 'success', customer_name: 'Walk-in', description: 'Advance booking deposit', created_at: '2026-07-01T18:00:00Z' },
  { id: 'tx-3', shop_id: 'shop-1', amount: 1000, commission: 0, owner_amount: 1000, type: 'debit', method: 'payout', status: 'success', description: 'Bank Payout to Sanjeev Kumar', created_at: '2026-06-30T10:00:00Z' },
  { id: 'tx-4', shop_id: 'shop-2', amount: 2000, commission: 200, owner_amount: 1800, type: 'credit', method: 'upi', status: 'success', booking_id: 'b-6', customer_name: 'Priya Sen', description: 'Swedish Massage - Priya Sen', created_at: '2026-07-02T15:05:00Z' }
];

const seedWallets = [
  { shop_id: 'shop-1', total_earned: 5650, pending_settlement: 1665, last_payout_amount: 1000, last_payout_date: '2026-06-30' },
  { shop_id: 'shop-2', total_earned: 2000, pending_settlement: 1800, last_payout_amount: 0, last_payout_date: '' }
];

const seedNotifications: AppNotification[] = [
  { id: 'nt-1', shop_id: 'shop-1', title: 'New Booking Recieved', message: 'Vikram Singh booked Beard Grooming with Rahul at 02:00 PM', type: 'new_booking', is_read: false, created_at: '2026-07-02T09:15:00Z' },
  { id: 'nt-2', shop_id: 'shop-1', title: 'Payment Confirmed', message: 'Received ₹350 via UPI from Rohan Sharma (Classic Haircut)', type: 'payment_received', is_read: true, created_at: '2026-07-02T10:45:00Z' },
  { id: 'nt-3', shop_id: 'shop-1', title: 'Booking Request Rescheduled', message: 'Ananya Roy shifted face massage to 12:30 PM today', type: 'new_booking', is_read: true, created_at: '2026-07-01T15:20:00Z' }
];

const seedReviews: Review[] = [
  { id: 'rev-1', shop_id: 'shop-1', customer_id: 'cust-1', customer_name: 'Rohan Sharma', rating: 5, comment: 'Excellent service by Amit!', created_at: '2026-06-30T10:00:00Z' }
];

// Setup default DB values if they do not exist
const initDB = () => {
  if (!localStorage.getItem(KEYS.SHOPS)) {
    localStorage.setItem(KEYS.SHOPS, JSON.stringify(seedShops));
  }
  if (!localStorage.getItem(KEYS.SERVICES)) {
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(seedServices));
  }
  if (!localStorage.getItem(KEYS.STAFF)) {
    localStorage.setItem(KEYS.STAFF, JSON.stringify(seedStaff));
  }
  if (!localStorage.getItem(KEYS.BOOKINGS)) {
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(seedBookings));
  }
  if (!localStorage.getItem(KEYS.CUSTOMERS)) {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(seedCustomers));
  }
  if (!localStorage.getItem(KEYS.BLOCKED_SLOTS)) {
    localStorage.setItem(KEYS.BLOCKED_SLOTS, JSON.stringify(seedBlockedSlots));
  }
  if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(seedTransactions));
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(seedNotifications));
  }
  if (!localStorage.getItem(KEYS.WALLETS)) {
    localStorage.setItem(KEYS.WALLETS, JSON.stringify(seedWallets));
  }
  if (!localStorage.getItem(KEYS.REVIEWS)) {
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(seedReviews));
  }
  // Let's pre-load default logged-in owner for quick access/testing!
  if (!localStorage.getItem(KEYS.OWNER)) {
    localStorage.setItem(KEYS.OWNER, JSON.stringify(seedOwners[0]));
  }
  if (!localStorage.getItem(KEYS.ACTIVE_SHOP_ID)) {
    localStorage.setItem(KEYS.ACTIVE_SHOP_ID, 'shop-1');
  }
};

// Execute DB initialization
initDB();

let onMutationCallback: ((type: string, shopId: string, payload: any, description: string) => void) | null = null;

export const dbMock = {
  setMutationHook: (cb: typeof onMutationCallback) => {
    onMutationCallback = cb;
  },
  // Authentication & Session Simulation
  getLoggedInOwner: (): Owner | null => {
    const raw = localStorage.getItem(KEYS.OWNER);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Owner;
    if (!parsed.role) {
      parsed.role = 'shop_owner';
      localStorage.setItem(KEYS.OWNER, JSON.stringify(parsed));
    }
    return parsed;
  },

  setLoggedInOwner: (owner: Owner | null) => {
    if (owner) {
      localStorage.setItem(KEYS.OWNER, JSON.stringify(owner));
    } else {
      localStorage.removeItem(KEYS.OWNER);
      localStorage.removeItem(KEYS.ACTIVE_SHOP_ID);
    }
  },

  signup: (
    email: string,
    name: string,
    phone: string,
    shopName: string,
    businessCategory: string,
    city: string,
    area: string
  ): Owner => {
    const ownerId = uuid();
    const newOwner: Owner = { id: ownerId, email, name, phone, role: 'shop_owner' };
    dbMock.setLoggedInOwner(newOwner);

    // 1. Create/Update Profiles simulation
    const profilesRaw = localStorage.getItem('nexora_profiles') || '[]';
    const profiles = JSON.parse(profilesRaw);
    profiles.push({
      id: ownerId,
      email,
      name,
      phone,
      city,
      area,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('nexora_profiles', JSON.stringify(profiles));

    // 2. Create/Update User Roles simulation
    const userRolesRaw = localStorage.getItem('nexora_user_roles') || '[]';
    const userRoles = JSON.parse(userRolesRaw);
    userRoles.push({
      user_id: ownerId,
      role: 'shop_owner'
    });
    localStorage.setItem('nexora_user_roles', JSON.stringify(userRoles));

    // 3. Create/Update Salon Owners simulation
    const salonOwnersRaw = localStorage.getItem('nexora_salon_owners') || '[]';
    const salonOwners = JSON.parse(salonOwnersRaw);
    salonOwners.push({
      id: ownerId,
      name,
      phone,
      email,
      city,
      area
    });
    localStorage.setItem('nexora_salon_owners', JSON.stringify(salonOwners));

    // 4. Create/Update Shops/Salons
    const defaultShop: Shop = {
      id: `shop-${uuid()}`,
      owner_id: ownerId,
      name: shopName,
      type: businessCategory || 'Salon',
      address: `${area}, ${city}`,
      phone: phone,
      rating: 5.0,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=nexora${ownerId}@okaxis%26pn=${encodeURIComponent(name)}%26am=0%26cu=INR`,
      upi_id: `nexora${ownerId}@okaxis`
    };

    const currentShops = dbMock.getShopsRaw();
    currentShops.push(defaultShop);
    localStorage.setItem(KEYS.SHOPS, JSON.stringify(currentShops));

    // Initialize basic services for this default shop
    const defaultServices: Service[] = [
      { id: uuid(), shop_id: defaultShop.id, name: 'Standard Haircut', duration_mins: 30, price: 200, category: 'Hair', is_active: true },
      { id: uuid(), shop_id: defaultShop.id, name: 'Premium Hair Spa', duration_mins: 60, price: 800, category: 'Hair', is_active: true }
    ];
    const currentServices = dbMock.getServicesRaw();
    localStorage.setItem(KEYS.SERVICES, JSON.stringify([...currentServices, ...defaultServices]));

    // Initialize basic staff for this default shop
    const defaultStaff: Staff[] = [
      { id: uuid(), shop_id: defaultShop.id, name: 'Manager Stylist', role: 'Main Stylist', phone, rating: 5.0, is_available: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80' }
    ];
    const currentStaff = dbMock.getStaffRaw();
    localStorage.setItem(KEYS.STAFF, JSON.stringify([...currentStaff, ...defaultStaff]));

    dbMock.setActiveShopId(defaultShop.id);
    return newOwner;
  },

  // Active Shop context
  getActiveShopId: (): string | null => {
    return localStorage.getItem(KEYS.ACTIVE_SHOP_ID);
  },

  setActiveShopId: (shopId: string) => {
    localStorage.setItem(KEYS.ACTIVE_SHOP_ID, shopId);
  },

  // Raw Readers
  getShopsRaw: (): Shop[] => JSON.parse(localStorage.getItem(KEYS.SHOPS) || '[]'),
  getServicesRaw: (): Service[] => JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]'),
  getStaffRaw: (): Staff[] => JSON.parse(localStorage.getItem(KEYS.STAFF) || '[]'),
  getBookingsRaw: (): Booking[] => JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]'),
  getCustomersRaw: (): Customer[] => JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]'),
  getBlockedSlotsRaw: (): BlockedSlot[] => JSON.parse(localStorage.getItem(KEYS.BLOCKED_SLOTS) || '[]'),
  getTransactionsRaw: (): WalletTransaction[] => JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]'),
  getNotificationsRaw: (): AppNotification[] => JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]'),
  getWalletsRaw: (): any[] => JSON.parse(localStorage.getItem(KEYS.WALLETS) || '[]'),

  // RLS Filtered Queries (Always scoped by shop_id or owner_id)
  getShopsForOwner: (ownerId: string): Shop[] => {
    return dbMock.getShopsRaw().filter(shop => shop.owner_id === ownerId);
  },

  getServices: (shopId: string): Service[] => {
    return dbMock.getServicesRaw().filter(service => service.shop_id === shopId);
  },

  getStaff: (shopId: string): Staff[] => {
    return dbMock.getStaffRaw().filter(staff => staff.shop_id === shopId);
  },

  getBookings: (shopId: string): Booking[] => {
    return dbMock.getBookingsRaw().filter(booking => booking.shop_id === shopId);
  },

  getCustomers: (shopId: string): Customer[] => {
    return dbMock.getCustomersRaw().filter(customer => customer.shop_id === shopId);
  },

  getBlockedSlots: (shopId: string): BlockedSlot[] => {
    return dbMock.getBlockedSlotsRaw().filter(slot => slot.shop_id === shopId);
  },

  getTransactions: (shopId: string): WalletTransaction[] => {
    return dbMock.getTransactionsRaw().filter(tx => tx.shop_id === shopId);
  },

  getNotifications: (shopId: string): AppNotification[] => {
    return dbMock.getNotificationsRaw().filter(notif => notif.shop_id === shopId);
  },

  getReviews: (shopId: string): Review[] => {
    return JSON.parse(localStorage.getItem(KEYS.REVIEWS) || '[]').filter((r: Review) => r.shop_id === shopId);
  },

  // Mutations
  addShop: (ownerId: string, shop: Omit<Shop, 'id' | 'owner_id' | 'qr_code_url'>): Shop => {
    const id = `shop-${uuid()}`;
    const newShop: Shop = {
      ...shop,
      id,
      owner_id: ownerId,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(shop.upi_id)}%26pn=${encodeURIComponent(shop.name)}%26am=0%26cu=INR`
    };
    const current = dbMock.getShopsRaw();
    current.push(newShop);
    localStorage.setItem(KEYS.SHOPS, JSON.stringify(current));
    return newShop;
  },

  // Services mutations
  saveService: (shopId: string, service: Partial<Service> & { id?: string }): Service => {
    const current = dbMock.getServicesRaw();
    let updated: Service;

    if (service.id) {
      updated = current.find(s => s.id === service.id && s.shop_id === shopId) as Service;
      if (!updated) {
        throw new Error('Service not found');
      }
      Object.assign(updated, service);
    } else {
      updated = {
        id: `srv-${uuid()}`,
        shop_id: shopId,
        name: service.name || 'Untitled Service',
        duration_mins: service.duration_mins || 30,
        price: service.price || 0,
        category: service.category || 'General',
        is_active: service.is_active !== false
      };
      current.push(updated);
    }

    localStorage.setItem(KEYS.SERVICES, JSON.stringify(current));
    if (onMutationCallback) {
      onMutationCallback('save_service', shopId, updated, `Save Service: ${updated.name}`);
    }
    return updated;
  },

  deleteService: (shopId: string, serviceId: string) => {
    const current = dbMock.getServicesRaw();
    const filtered = current.filter(s => !(s.id === serviceId && s.shop_id === shopId));
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(filtered));
    if (onMutationCallback) {
      onMutationCallback('delete_service', shopId, { id: serviceId }, `Delete Service`);
    }
  },

  // Staff mutations
  saveStaff: (shopId: string, staff: Partial<Staff> & { id?: string }): Staff => {
    const current = dbMock.getStaffRaw();
    let updated: Staff;

    if (staff.id) {
      updated = current.find(s => s.id === staff.id && s.shop_id === shopId) as Staff;
      if (!updated) {
        throw new Error('Staff member not found');
      }
      Object.assign(updated, staff);
    } else {
      updated = {
        id: `stf-${uuid()}`,
        shop_id: shopId,
        name: staff.name || 'New Staff',
        role: staff.role || 'Stylist',
        phone: staff.phone || '',
        rating: 5.0,
        is_available: staff.is_available !== false,
        avatar: staff.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80'
      };
      current.push(updated);
    }

    localStorage.setItem(KEYS.STAFF, JSON.stringify(current));
    if (onMutationCallback) {
      onMutationCallback('save_staff', shopId, updated, `Save Staff: ${updated.name}`);
    }
    return updated;
  },

  deleteStaff: (shopId: string, staffId: string) => {
    const current = dbMock.getStaffRaw();
    const filtered = current.filter(s => !(s.id === staffId && s.shop_id === shopId));
    localStorage.setItem(KEYS.STAFF, JSON.stringify(filtered));
    if (onMutationCallback) {
      onMutationCallback('delete_staff', shopId, { id: staffId }, `Delete Staff`);
    }
  },

  // Block slots mutations
  addBlockedSlot: (shopId: string, slot: Omit<BlockedSlot, 'id' | 'shop_id' | 'created_at' | 'created_by' | 'is_active'>): BlockedSlot => {
    const id = `blk-${uuid()}`;
    const loggedOwner = dbMock.getLoggedInOwner();
    const newSlot: BlockedSlot = { 
      ...slot, 
      id, 
      shop_id: shopId,
      is_active: true,
      created_by: loggedOwner?.id || 'system',
      created_at: new Date().toISOString()
    };
    const current = dbMock.getBlockedSlotsRaw();
    current.push(newSlot);
    localStorage.setItem(KEYS.BLOCKED_SLOTS, JSON.stringify(current));
    if (onMutationCallback) {
      onMutationCallback('add_blocked_slot', shopId, newSlot, `Block Slot: ${newSlot.reason || 'Lunch Break'}`);
    }
    return newSlot;
  },


  saveBlockedSlot: (shopId: string, slot: Partial<BlockedSlot> & { id?: string }): BlockedSlot => {
    if (slot.id) {
      const current = dbMock.getBlockedSlotsRaw();
      const existing = current.find(s => s.id === slot.id && s.shop_id === shopId);
      if (!existing) throw new Error('Blocked slot not found');
      Object.assign(existing, slot);
      localStorage.setItem(KEYS.BLOCKED_SLOTS, JSON.stringify(current));
      return existing;
    } else {
      return dbMock.addBlockedSlot(shopId, slot as Omit<BlockedSlot, 'id' | 'shop_id'>);
    }
  },
  deleteBlockedSlot: (shopId: string, slotId: string) => {
    const current = dbMock.getBlockedSlotsRaw();
    const filtered = current.filter(s => !(s.id === slotId && s.shop_id === shopId));
    localStorage.setItem(KEYS.BLOCKED_SLOTS, JSON.stringify(filtered));
    if (onMutationCallback) {
      onMutationCallback('delete_blocked_slot', shopId, { id: slotId }, `Delete Blocked Slot`);
    }
  },

  // Bookings mutations
  saveBooking: (shopId: string, booking: Partial<Booking> & { id?: string }): Booking => {
    const currentBookings = dbMock.getBookingsRaw();
    let updated: Booking;

    if (booking.id) {
      updated = currentBookings.find(b => b.id === booking.id && b.shop_id === shopId) as Booking;
      if (!updated) {
        throw new Error('Booking not found');
      }
      Object.assign(updated, booking);

      // Side Effect: If marked completed, generate transaction and maybe add to customer totals
      if (booking.status === 'completed') {
        dbMock.handleBookingCompleted(shopId, updated);
      }
    } else {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      updated = {
        id: `b-${uuid()}`,
        shop_id: shopId,
        customer_name: booking.customer_name || 'Walk-in Customer',
        customer_phone: booking.customer_phone || '',
        customer_id: booking.customer_id,
        service_id: booking.service_id || '',
        service_name: booking.service_name || 'Service',
        price: booking.price || 0,
        staff_id: booking.staff_id || '',
        staff_name: booking.staff_name || 'Staff',
        date: booking.date || '2026-07-02',
        time_slot: booking.time_slot || '12:00',
        status: booking.status || 'pending',
        payment_status: booking.payment_status || 'unpaid',
        payment_method: booking.payment_method,
        otp_code: generatedOtp,
        notes: booking.notes,
        created_at: new Date().toISOString()
      };
      currentBookings.push(updated);

      // Increment customer stats or create customer
      dbMock.updateOrCreateCustomer(shopId, updated.customer_name, updated.customer_phone);

      // Create notification
      dbMock.addNotification(shopId, {
        title: 'New Manual Booking',
        message: `${updated.customer_name} booked ${updated.service_name} with ${updated.staff_name} at ${updated.time_slot}`,
        type: 'new_booking'
      });
    }

    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(currentBookings));
    if (onMutationCallback) {
      const isStatusUpdate = !!booking.id;
      const type = isStatusUpdate ? 'update_booking_status' : 'save_booking';
      const desc = isStatusUpdate 
        ? `Update Booking: ${updated.customer_name} -> ${updated.status}`
        : `New Booking: ${updated.customer_name} (${updated.service_name})`;
      onMutationCallback(type, shopId, updated, desc);
    }
    return updated;
  },

  saveCustomer: (shopId: string, customer: Customer): Customer => {
    const current = dbMock.getCustomersRaw();
    const existingIndex = current.findIndex(c => c.id === customer.id);
    let updated: Customer;

    if (existingIndex >= 0) {
      updated = { ...current[existingIndex], ...customer };
      current[existingIndex] = updated;
    } else {
      updated = {
        ...customer,
        id: customer.id || `cust-${uuid()}`,
        shop_id: shopId
      };
      current.push(updated);
    }

    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(current));
    if (onMutationCallback) {
      onMutationCallback('save_customer', shopId, updated, `Update Customer: ${updated.name}`);
    }
    return updated;
  },

  // Helper side effects
  updateOrCreateCustomer: (shopId: string, name: string, phone: string) => {
    const customers = dbMock.getCustomersRaw();
    let cust = customers.find(c => c.phone === phone && c.shop_id === shopId);

    if (cust) {
      cust.total_bookings += 1;
      cust.last_visit_date = new Date().toISOString().split('T')[0];
    } else {
      cust = {
        id: `cust-${uuid()}`,
        shop_id: shopId,
        name,
        phone,
        total_bookings: 1,
        total_spent: 0,
        last_visit_date: new Date().toISOString().split('T')[0]
      };
      customers.push(cust);
    }
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  handleBookingCompleted: (shopId: string, booking: Booking) => {
    // Check if we already credited this transaction to avoid double counting
    const txs = dbMock.getTransactionsRaw();
    const alreadyExists = txs.some(t => t.booking_id === booking.id);
    if (alreadyExists) return;

    // Commission logic: Nexora takes 10% on UPI payments
    const commission = booking.payment_method === 'upi' ? Math.round(booking.price * 0.1) : 0;
    const ownerAmount = booking.price - commission;

    // Create a wallet credit transaction
    const newTx: WalletTransaction = {
      id: `tx-${uuid()}`,
      shop_id: shopId,
      amount: booking.price,
      commission,
      owner_amount: ownerAmount,
      type: 'credit',
      method: booking.payment_method || 'cash',
      status: 'success',
      booking_id: booking.id,
      customer_name: booking.customer_name,
      description: `${booking.service_name} - ${booking.customer_name}`,
      created_at: new Date().toISOString()
    };
    txs.push(newTx);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));

    // Update wallet
    if (booking.payment_method === 'upi') {
      const wallets = dbMock.getWalletsRaw();
      let wallet = wallets.find(w => w.shop_id === shopId);
      if (!wallet) {
        wallet = { shop_id: shopId, total_earned: 0, pending_settlement: 0, last_payout_amount: 0, last_payout_date: '' };
        wallets.push(wallet);
      }
      wallet.total_earned += booking.price;
      wallet.pending_settlement += ownerAmount;
      localStorage.setItem(KEYS.WALLETS, JSON.stringify(wallets));
    }

    // Update customer's spend details
    if (booking.customer_phone) {
      const customers = dbMock.getCustomersRaw();
      const cust = customers.find(c => c.phone === booking.customer_phone && c.shop_id === shopId);
      if (cust) {
        cust.total_spent += booking.price;
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
      }
    }

    // Add payment notification
    dbMock.addNotification(shopId, {
      title: 'Payment Received',
      message: `₹${booking.price} collected from ${booking.customer_name} via ${booking.payment_method?.toUpperCase() || 'CASH'}`,
      type: 'payment_received'
    });
  },

  addNotification: (shopId: string, item: Omit<AppNotification, 'id' | 'shop_id' | 'is_read' | 'created_at'>): AppNotification => {
    const id = `nt-${uuid()}`;
    const newNotif: AppNotification = {
      ...item,
      id,
      shop_id: shopId,
      is_read: false,
      created_at: new Date().toISOString()
    };
    const current = dbMock.getNotificationsRaw();
    current.unshift(newNotif); // latest first
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(current));
    return newNotif;
  },

  markNotificationRead: (shopId: string, id: string) => {
    const current = dbMock.getNotificationsRaw();
    const target = current.find(n => n.id === id && n.shop_id === shopId);
    if (target) {
      target.is_read = true;
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(current));
      if (onMutationCallback) {
        onMutationCallback('mark_notification_read', shopId, { id }, `Mark Notification as Read`);
      }
    }
  },

  markAllNotificationsRead: (shopId: string) => {
    const current = dbMock.getNotificationsRaw();
    current.forEach(n => {
      if (n.shop_id === shopId) {
        n.is_read = true;
      }
    });
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(current));
    if (onMutationCallback) {
      onMutationCallback('read_all_notifications', shopId, {}, `Mark All Notifications as Read`);
    }
  },

  deleteNotification: (shopId: string, id: string) => {
    const current = dbMock.getNotificationsRaw();
    const filtered = current.filter(n => !(n.id === id && n.shop_id === shopId));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(filtered));
    if (onMutationCallback) {
      onMutationCallback('delete_notification', shopId, { id }, `Delete Notification`);
    }
  },

  getWallet: (shopId: string) => {
    const wallets = dbMock.getWalletsRaw();
    return wallets.find(w => w.shop_id === shopId) || { shop_id: shopId, total_earned: 0, pending_settlement: 0, last_payout_amount: 0, last_payout_date: '' };
  },

  saveShop: (shopId: string, data: Partial<Shop>) => {
    const shops = dbMock.getShopsRaw();
    const shopIdx = shops.findIndex(s => s.id === shopId);
    if (shopIdx > -1) {
      shops[shopIdx] = { ...shops[shopIdx], ...data };
      localStorage.setItem(KEYS.SHOPS, JSON.stringify(shops));
      if (onMutationCallback) {
        onMutationCallback('save_shop', shopId, shops[shopIdx], `Update Shop Profile`);
      }
      return shops[shopIdx];
    }
    throw new Error('Shop not found');
  }
};
