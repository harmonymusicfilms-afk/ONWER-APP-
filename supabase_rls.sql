-- RLS Policies for Nexora Owner App
-- Role: Shop Owner

-- 1. Profiles (Owners)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Owners can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Owners can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 1.5 User Roles
-- Ensure RLS is enabled
alter table public.user_roles enable row level security;

-- Drop any old permissive policies first
drop policy if exists "Allow authenticated read" on public.user_roles;
drop policy if exists "Allow authenticated insert" on public.user_roles;
drop policy if exists "Allow authenticated upsert" on public.user_roles;
drop policy if exists "Users can read own role" on public.user_roles;

-- Only SELECT for authenticated users, scoped to their own row
create policy "authenticated_select_own_role"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

-- 2. Shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own shop" ON public.shops
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
));

CREATE POLICY "Owners can update own shop" ON public.shops
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()
));

CREATE POLICY "Owners can insert own shop" ON public.shops
FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 3. Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own bookings" ON public.bookings
FOR SELECT USING (shop_id IN (
  SELECT id FROM public.shops WHERE owner_id = auth.uid()
));

CREATE POLICY "Owners can create bookings" ON public.bookings
FOR INSERT WITH CHECK (shop_id IN (
  SELECT id FROM public.shops WHERE owner_id = auth.uid()
));

CREATE POLICY "Owners can update own bookings" ON public.bookings
FOR UPDATE USING (shop_id IN (
  SELECT id FROM public.shops WHERE owner_id = auth.uid()
));

-- 4. Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own customers" ON public.customers
FOR SELECT USING (shop_id IN (
  SELECT id FROM public.shops WHERE owner_id = auth.uid()
));

-- 5. Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own services" ON public.services
FOR SELECT USING (shop_id IN (
  SELECT id FROM public.shops WHERE owner_id = auth.uid()
));

-- 6. Staff
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own staff" ON public.staff
FOR SELECT USING (shop_id IN (
  SELECT id FROM public.shops WHERE owner_id = auth.uid()
));

-- 7. Wallet
ALTER TABLE public.salon_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own wallet" ON public.salon_wallets
FOR SELECT USING (shop_id IN (
  SELECT id FROM public.shops WHERE owner_id = auth.uid()
));

-- 8. Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own notifications" ON public.notifications
FOR SELECT USING (shop_id IN (
  SELECT id FROM public.shops WHERE owner_id = auth.uid()
));

-- 9. Chat
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage chat rooms" ON public.chat_rooms
FOR ALL USING (shop_id IN (
  SELECT id FROM public.shops WHERE owner_id = auth.uid()
));

CREATE POLICY "Owners can manage messages" ON public.chat_messages
FOR ALL USING (room_id IN (
  SELECT id FROM public.chat_rooms WHERE shop_id IN (
    SELECT id FROM public.shops WHERE owner_id = auth.uid()
  )
));

-- Storage RLS Policies
-- shop-logos bucket
CREATE POLICY "Owners can upload shop logos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'shop-logos' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.shops WHERE owner_id = auth.uid()
));

-- staff-photos bucket
CREATE POLICY "Owners can upload staff photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'staff-photos' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.shops WHERE owner_id = auth.uid()
));

-- gallery bucket
CREATE POLICY "Owners can upload gallery images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'gallery' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.shops WHERE owner_id = auth.uid()
));

-- profiles bucket
CREATE POLICY "Owners can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);
