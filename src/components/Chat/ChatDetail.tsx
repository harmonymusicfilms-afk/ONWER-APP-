import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  MoreVertical,
  User,
  Paperclip,
  Check,
  CheckCheck,
  Phone,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { ChatRoom, ChatMessage, Shop } from '../../types';
import { format } from 'date-fns';

interface ChatDetailProps {
  room: ChatRoom;
  shop: Shop;
  onBack: () => void;
  isShopOwner: boolean;
}

export const ChatDetail: React.FC<ChatDetailProps> = ({ room, shop, onBack, isShopOwner }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    markRoomAsRead();

    // Subscribe to new messages
    const channel = supabase
      .channel(`thread_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${room.id}`
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id !== (supabase.auth.getUser() as any).data.user?.id) {
            markRoomAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRoomAsRead = async () => {
    try {
      await supabase
        .from('chat_rooms')
        .update({ unread_count_shop: 0 })
        .eq('id', room.id);
    } catch (err) {
      console.error('Error marking room as read:', err);
    }
  };

  const handleQuickReply = async (replyText: string) => {
    await sendMessage(replyText);
  };

  const sendMessage = async (messageText: string) => {
    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: room.id,
          message_text: messageText,
          sender_role: isShopOwner ? 'shop_owner' : 'customer',
          sender_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      await supabase.from('notifications').insert({
        shop_id: shop.id,
        title: isShopOwner ? `New message from ${room.customer_name}` : `New reply from shop`,
        message: messageText,
        type: 'system'
      });

      // Update last message in thread
      await supabase
        .from('chat_threads')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          customer_unread_count: isShopOwner ? (room.customer_unread_count || 0) + 1 : 0,
          owner_unread_count: !isShopOwner ? (room.owner_unread_count || 0) + 1 : 0
        })
        .eq('id', room.id);

    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || sending) return;
    const messageText = newMessage.trim();
    setNewMessage('');
    await sendMessage(messageText);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${room.id}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('chat-images').getPublicUrl(fileName);

      await supabase
        .from('chat_messages')
        .insert({
          thread_id: room.id,
          message_type: 'image',
          image_url: data.publicUrl,
          sender_role: isShopOwner ? 'shop_owner' : 'customer',
          sender_id: (await supabase.auth.getUser()).data.user?.id
        });
      
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">
                {room.customer_name}
              </h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Online</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {room.customer_phone && (
            <a 
              href={`tel:${room.customer_phone}`}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600"
            >
              <Phone className="w-5 h-5" />
            </a>
          )}
          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-10">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <MessageCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-slate-500 text-sm">
              No messages yet. Send a message to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = isShopOwner ? msg.sender_role === 'shop_owner' : msg.sender_role === 'customer';
            const showDate = idx === 0 || format(new Date(messages[idx-1].created_at), 'yyyy-MM-dd') !== format(new Date(msg.created_at), 'yyyy-MM-dd');

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
                      {format(new Date(msg.created_at), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                    }`}
                  >
                    {msg.message_type === 'text' ? (
                      <p className="text-sm leading-relaxed">{msg.message_text}</p>
                    ) : (
                      <img src={msg.image_url || ''} alt="chat" className="max-w-full rounded-lg" />
                    )}
                    <div className={`flex items-center gap-1 justify-end mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                      <span className="text-[10px]">
                        {format(new Date(msg.created_at), 'hh:mm a')}
                      </span>
                      {isMe && (
                        msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Quick Replies */}
      {isShopOwner && (
        <div className="px-4 py-2 bg-slate-50 border-t flex gap-2 overflow-x-auto">
          {['Yes, slot available.', 'Please select service.', 'Please share location.', 'Your booking is confirmed.', 'Please arrive 10 minutes early.'].map((reply) => (
            <button 
              key={reply}
              onClick={() => handleQuickReply(reply)}
              className="whitespace-nowrap bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="bg-white p-4 border-t sticky bottom-0">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 bg-slate-100 rounded-2xl px-2 py-1"
        >
          <div className="flex items-center gap-1">
            <label className="p-2 hover:bg-slate-200 rounded-full cursor-pointer transition-colors text-slate-500">
              <ImageIcon className="w-5 h-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <button 
              type="button"
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-sm text-slate-800 placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-xl transition-all ${
              newMessage.trim() && !sending
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

