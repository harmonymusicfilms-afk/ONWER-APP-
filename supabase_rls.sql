-- RLS Policies for Nexora Owner App
-- Role: Shop Owner

-- 1. Profiles (Owners)
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own profile" ON public.owners
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Owners can update own profile" ON public.owners
FOR UPDATE USING (auth.uid() = id);

-- 2. Shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own shop" ON public.shops
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.owners WHERE owners.id = auth.uid() AND owners.shop_id = shops.id
));

CREATE POLICY "Owners can update own shop" ON public.shops
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.owners WHERE owners.id = auth.uid() AND owners.shop_id = shops.id
));

-- 3. Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own bookings" ON public.bookings
FOR SELECT USING (shop_id IN (
  SELECT shop_id FROM public.owners WHERE id = auth.uid()
));

CREATE POLICY "Owners can create bookings" ON public.bookings
FOR INSERT WITH CHECK (shop_id IN (
  SELECT shop_id FROM public.owners WHERE id = auth.uid()
));

CREATE POLICY "Owners can update own bookings" ON public.bookings
FOR UPDATE USING (shop_id IN (
  SELECT shop_id FROM public.owners WHERE id = auth.uid()
));

-- 4. Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own customers" ON public.customers
FOR SELECT USING (shop_id IN (
  SELECT shop_id FROM public.owners WHERE id = auth.uid()
));

-- 5. Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own services" ON public.services
FOR SELECT USING (shop_id IN (
  SELECT shop_id FROM public.owners WHERE id = auth.uid()
));

-- 6. Staff
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own staff" ON public.staff
FOR SELECT USING (shop_id IN (
  SELECT shop_id FROM public.owners WHERE id = auth.uid()
));

-- 7. Wallet
ALTER TABLE public.salon_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own wallet" ON public.salon_wallets
FOR SELECT USING (shop_id IN (
  SELECT shop_id FROM public.owners WHERE id = auth.uid()
));

-- 8. Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own notifications" ON public.notifications
FOR SELECT USING (shop_id IN (
  SELECT shop_id FROM public.owners WHERE id = auth.uid()
));

-- Storage RLS Policies
-- shop-logos bucket
CREATE POLICY "Owners can upload shop logos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'shop-logos' AND (storage.foldername(name))[1] IN (
  SELECT shop_id::text FROM public.owners WHERE id = auth.uid()
));

-- staff-photos bucket
CREATE POLICY "Owners can upload staff photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'staff-photos' AND (storage.foldername(name))[1] IN (
  SELECT shop_id::text FROM public.owners WHERE id = auth.uid()
));

-- gallery bucket
CREATE POLICY "Owners can upload gallery images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'gallery' AND (storage.foldername(name))[1] IN (
  SELECT shop_id::text FROM public.owners WHERE id = auth.uid()
));

-- profiles bucket
CREATE POLICY "Owners can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);
