/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Owner {
  id: string;
  email: string;
  name: string;
  phone: string;
  role?: string;
  avatar?: string;
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
  category?: string;
  city?: string;
  area?: string;
  opening_time?: string;
  closing_time?: string;
  is_active?: boolean;
  logo_url?: string;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  duration_mins: number;
  price: number;
  category: string;
  description?: string;
  is_active: boolean;
  image_url?: string;
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
  available_days?: string[];
  opening_time?: string;
  closing_time?: string;
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
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
  reward_points?: number;
  last_visit_date?: string;
  notes?: string;
  tags?: string[];
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
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface CustomerInsight {
  id: string;
  customer_id: string;
  shop_id: string;
  tier: 'Gold' | 'Silver' | 'Bronze';
  total_visits: number;
  lifetime_spend: number;
  last_visited_at: string;
  preferences: string[];
}

export interface WalletTransaction {
  id: string;
  shop_id: string;
  amount: number;
  commission: number;
  owner_amount: number;
  type: 'credit' | 'debit';
  method: 'upi' | 'cash' | 'card' | 'payout';
  status: 'success' | 'pending' | 'failed';
  booking_id?: string;
  customer_name?: string;
  description: string;
  created_at: string;
}

export interface SalonWallet {
  shop_id: string;
  total_earned: number;
  pending_settlement: number;
  last_payout_amount: number;
  last_payout_date: string;
}

export interface AppNotification {
  id: string;
  shop_id: string;
  title: string;
  message: string;
  type: 'new_booking' | 'booking_cancelled' | 'payment_received' | 'settlement' | 'review' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  shop_id: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ChatThread {
  id: string;
  shop_id: string;
  customer_id: string;
  owner_id?: string;
  booking_id?: string;
  last_message?: string;
  last_message_at?: string;
  customer_unread: number;
  owner_unread: number;
  status: 'active' | 'archived' | 'muted';
  created_at: string;
  customer_name?: string;
  customer_avatar?: string;
  is_online?: boolean;
  last_seen?: string;
  is_typing?: boolean;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: 'shop_owner' | 'customer';
  message_type: 'text' | 'image' | 'booking_card' | 'system' | 'voice' | 'service_card' | 'location' | 'offer_card' | 'payment_confirmation';
  message?: string;
  image_url?: string;
  is_read: boolean;
  delivered: boolean;
  reply_to_id?: string;
  is_starred: boolean;
  metadata?: any;
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
  | 'edit_shop'
  | 'unauthorized'
  | 'role_setup'
  | 'chat_list'
  | 'chat_detail'
  | 'rewards';
