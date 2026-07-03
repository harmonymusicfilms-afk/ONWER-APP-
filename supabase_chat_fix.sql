-- NEXORA SALON OS - CHAT SYSTEM TABLES
-- Run this in your Supabase SQL Editor to fix the missing table error and add new chat features.

-- 1. Create chat_threads table (replaces chat_rooms)
CREATE TABLE IF NOT EXISTS public.chat_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE NOT NULL,
    customer_id UUID,
    owner_id UUID,
    booking_id UUID,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    customer_unread_count INTEGER DEFAULT 0,
    owner_unread_count INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'closed')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create chat_messages table (replaces/updates chat_messages)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID REFERENCES public.chat_threads ON DELETE CASCADE NOT NULL,
    sender_id UUID,
    sender_role TEXT CHECK (sender_role IN ('customer', 'shop_owner')) NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'image')) DEFAULT 'text',
    message_text TEXT,
    image_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create chat_quick_replies table
CREATE TABLE IF NOT EXISTS public.chat_quick_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops ON DELETE CASCADE,
    reply_text TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_quick_replies ENABLE ROW LEVEL SECURITY;

-- Add policies (simplified for now)
CREATE POLICY "Owners can manage chat threads" ON public.chat_threads FOR ALL USING (EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND owner_id = auth.uid()));
CREATE POLICY "Customers can manage chat threads" ON public.chat_threads FOR ALL USING (customer_id = auth.uid());

CREATE POLICY "Owners can manage chat messages" ON public.chat_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.chat_threads cr JOIN public.shops s ON cr.shop_id = s.id WHERE cr.id = thread_id AND s.owner_id = auth.uid()));
CREATE POLICY "Customers can manage chat messages" ON public.chat_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.chat_threads WHERE id = thread_id AND customer_id = auth.uid()));
