-- Enable Realtime for these tables
ALTER TABLE chat_threads REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- Add to Realtime Publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE chat_threads, chat_messages;
COMMIT;

-- Chat Threads Table
CREATE TABLE IF NOT EXISTS chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    booking_id UUID,
    owner_id UUID,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    customer_unread INTEGER DEFAULT 0,
    owner_unread INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_role TEXT NOT NULL, -- 'owner' or 'customer'
    message_type TEXT DEFAULT 'text', -- 'text', 'image', 'booking_card', 'system'
    message TEXT,
    image_url TEXT,
    is_read BOOLEAN DEFAULT false,
    delivered BOOLEAN DEFAULT true,
    reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    is_starred BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Media Table
CREATE TABLE IF NOT EXISTS chat_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    type TEXT NOT NULL, -- 'image', 'document', etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_media ENABLE ROW LEVEL SECURITY;

-- CUSTOMER POLICIES
CREATE POLICY "Customers can view their own threads" ON chat_threads
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create threads" ON chat_threads
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own threads" ON chat_threads
    FOR UPDATE USING (auth.uid() = customer_id);

-- OWNER POLICIES
CREATE POLICY "Owners can view their shop threads" ON chat_threads
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update their shop threads" ON chat_threads
    FOR UPDATE USING (auth.uid() = owner_id);

-- MESSAGE POLICIES
CREATE POLICY "Users can view messages in their threads" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE chat_threads.id = chat_messages.thread_id 
            AND (chat_threads.customer_id = auth.uid() OR chat_threads.owner_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages in their threads" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE chat_threads.id = chat_messages.thread_id 
            AND (chat_threads.customer_id = auth.uid() OR chat_threads.owner_id = auth.uid())
        )
    );

-- Function to increment unread counts atomically
CREATE OR REPLACE FUNCTION increment_unread(t_id UUID, role TEXT)
RETURNS VOID AS $$
BEGIN
    IF role = 'customer' THEN
        UPDATE chat_threads SET customer_unread = customer_unread + 1 WHERE id = t_id;
    ELSIF role = 'owner' THEN
        UPDATE chat_threads SET owner_unread = owner_unread + 1 WHERE id = t_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
