-- NEXORA SALON OS - SUPABASE SCHEMA
-- Copy and run this in your Supabase SQL Editor

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('shop_owner', 'staff', 'customer', 'super_admin', 'partner')) DEFAULT 'shop_owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 3. Shops Table
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    address TEXT,
    city TEXT,
    area TEXT,
    phone TEXT,
    rating DECIMAL DEFAULT 5.0,
    upi_id TEXT,
    logo_url TEXT,
    opening_time TEXT DEFAULT '09:00 AM',
    closing_time TEXT DEFAULT '08:00 PM',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL NOT NULL,
    duration INTEGER NOT NULL, -- minutes
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(shop_id, phone)
);

-- 7. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_id UUID REFERENCES public.services ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    price DECIMAL NOT NULL,
    staff_id UUID REFERENCES public.staff ON DELETE SET NULL,
    staff_name TEXT NOT NULL,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'pending',
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid_cash', 'paid_online')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Blocked Time Slots
CREATE TABLE IF NOT EXISTS public.blocked_time_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    staff_id UUID REFERENCES public.staff ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Salon Wallets
CREATE TABLE IF NOT EXISTS public.salon_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    balance DECIMAL DEFAULT 0,
    total_earnings DECIMAL DEFAULT 0,
    pending_payouts DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(shop_id)
);

-- 11. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    amount DECIMAL NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 13. Wallet Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('earning', 'withdrawal', 'refund')) NOT NULL,
    amount DECIMAL NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES

-- Profiles: Users can only read/write their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Roles: Users can read their own role
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Shops: Owners can only see/edit their own shops
CREATE POLICY "Owners can view own shops" ON public.shops FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can update own shops" ON public.shops FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert own shops" ON public.shops FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Filtered by shop_id and owner_id for all sub-tables
-- Bookings
CREATE POLICY "Owners can view bookings for their shops" ON public.bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can manage bookings for their shops" ON public.bookings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Services
CREATE POLICY "Owners can view services for their shops" ON public.services FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can manage services for their shops" ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Staff
CREATE POLICY "Owners can view staff for their shops" ON public.staff FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can manage staff for their shops" ON public.staff FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Customers
CREATE POLICY "Owners can view customers for their shops" ON public.customers FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can manage customers for their shops" ON public.customers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Blocked Slots
CREATE POLICY "Owners can view blocked slots for their shops" ON public.blocked_time_slots FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can manage blocked slots for their shops" ON public.blocked_time_slots FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Notifications
CREATE POLICY "Owners can view notifications for their shops" ON public.notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can manage notifications for their shops" ON public.notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Wallet
CREATE POLICY "Owners can view wallet for their shops" ON public.salon_wallets FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- Reviews
CREATE POLICY "Owners can view reviews for their shops" ON public.reviews FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid())
);

-- FUNCTIONS & TRIGGERS

-- Automatically create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'shop_owner');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
