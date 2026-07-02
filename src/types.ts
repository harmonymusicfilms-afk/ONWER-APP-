/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Owner {
  id: string;
  email: string;
  name: string;
  phone: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  type: string; // Saloon, Spa, Gym, Clinic, etc.
  address: string;
  phone: string;
  rating: number;
  qr_code_url: string; // UPI QR code simulated URL
  upi_id: string;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  duration_mins: number;
  price: number;
  category: string;
  is_active: boolean;
}

export interface Staff {
  id: string;
  shop_id: string;
  name: string;
  role: string;
  phone: string;
  rating: number;
  is_available: boolean;
  avatar: string;
}

export interface Booking {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_phone: string;
  customer_id?: string;
  service_id: string;
  service_name: string;
  price: number;
  staff_id: string;
  staff_name: string;
  date: string; // YYYY-MM-DD
  time_slot: string; // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid_online' | 'paid_cash';
  payment_method?: 'upi' | 'cash' | 'card';
  otp_code: string; // OTP for completion
  notes?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  email?: string;
  total_bookings: number;
  total_spent: number;
  last_visit_date?: string;
  notes?: string;
}

export interface BlockedSlot {
  id: string;
  shop_id: string;
  staff_id: string; // Can be "all"
  staff_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  reason: string;
}

export interface WalletTransaction {
  id: string;
  shop_id: string;
  amount: number;
  type: 'credit' | 'debit';
  method: 'upi' | 'cash' | 'card' | 'payout';
  status: 'success' | 'pending' | 'failed';
  booking_id?: string;
  description: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  shop_id: string;
  title: string;
  message: string;
  type: 'booking_new' | 'booking_cancelled' | 'payment_received' | 'system';
  is_read: boolean;
  created_at: string;
}

export type ScreenType =
  | 'splash'
  | 'login'
  | 'signup'
  | 'shop_selection'
  | 'home'
  | 'bookings'
  | 'booking_detail'
  | 'booking_add'
  | 'customers'
  | 'customer_detail'
  | 'services'
  | 'service_add_edit'
  | 'staff'
  | 'staff_add_edit'
  | 'block_slot'
  | 'wallet'
  | 'notifications'
  | 'profile'
  | 'help'
  | 'unauthorized';
