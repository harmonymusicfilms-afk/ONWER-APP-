import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  MoreVertical,
  Paperclip,
  Check,
  CheckCheck,
  Phone,
  Video,
  Smile,
  X,
  Download,
  Camera,
  Mic,
  Calendar,
  Search,
  Reply,
  Forward,
  Copy,
  Star,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { ChatThread, ChatMessage, Shop } from '../../types';
import { format, isToday, isYesterday } from 'date-fns';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useClickAway } from 'react-use';

interface ChatDetailProps {
  thread: ChatThread;
  shop: Shop;
  onBack: () => void;
  isShopOwner: boolean;
}

export const ChatDetail: React.FC<ChatDetailProps> = ({ thread, shop, onBack, isShopOwner }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useClickAway(emojiPickerRef, () => setShowEmojiPicker(false));

  const primaryBg = isShopOwner ? 'bg-[#2563EB]' : 'bg-[#7C3AED]';
  const primaryText = isShopOwner ? 'text-[#2563EB]' : 'text-[#7C3AED]';

  useEffect(() => {
    fetchMessages();
    markAsRead();

    // Subscribe to messages and presence
    const channel = supabase.channel(`thread:${thread.id}`, {
      config: {
        presence: {
          key: isShopOwner ? 'owner' : 'customer',
        },
      },
    });

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${thread.id}`
      }, (payload) => {
        const msg = payload.new as ChatMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        
        // Play subtle sound if not from me
        const isMe = isShopOwner ? msg.sender_role === 'shop_owner' : msg.sender_role === 'customer';
        if (!isMe) {
          playNotificationSound();
          markAsRead();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${thread.id}`
      }, (payload) => {
        const updatedMsg = payload.new as ChatMessage;
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherRole = isShopOwner ? 'customer' : 'shop_owner';
        const otherPresence = state[otherRole] as any[];
        
        setIsOnline(!!otherPresence?.length);
        if (otherPresence?.length) {
          setIsOtherTyping(otherPresence.some(p => p.is_typing));
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === (isShopOwner ? 'customer' : 'shop_owner')) {
          setIsOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key === (isShopOwner ? 'customer' : 'shop_owner')) {
          setIsOnline(false);
          setLastSeen(new Date().toISOString());
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            is_typing: false
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [thread.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  const playNotificationSound = () => {
    // Standard subtle "pop" or "ping"
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.volume = 0.2;
      audio.play();
    } catch (e) {}
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const unreadField = isShopOwner ? 'owner_unread' : 'customer_unread';
      await supabase
        .from('chat_threads')
        .update({ [unreadField]: 0 })
        .eq('id', thread.id);

      // Also mark messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('thread_id', thread.id)
        .neq('sender_role', isShopOwner ? 'owner' : 'customer');
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setReplyingTo(null);

    try {
      const { data: newMsg, error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: thread.id,
          message: messageText,
          message_type: 'text',
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          sender_role: isShopOwner ? 'owner' : 'customer',
          reply_to_id: replyingTo?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Update thread last message
      await supabase
        .from('chat_threads')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          [isShopOwner ? 'customer_unread' : 'owner_unread']: supabase.rpc('increment_unread', { t_id: thread.id, role: isShopOwner ? 'customer' : 'owner' })
        })
        .eq('id', thread.id);

    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (channelRef.current) {
      channelRef.current.track({
        online_at: new Date().toISOString(),
        is_typing: true
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.track({
          online_at: new Date().toISOString(),
          is_typing: false
        });
      }
    }, 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSending(true);
      const path = `chat/${thread.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);

      await supabase
        .from('chat_messages')
        .insert({
          thread_id: thread.id,
          message_type: 'image',
          image_url: publicUrl,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          sender_role: isShopOwner ? 'owner' : 'customer'
        });

    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'HH:mm');
  };

  const groupMessages = useMemo(() => {
    const groups: { [key: string]: ChatMessage[] } = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      let dateKey = '';
      if (isToday(date)) dateKey = 'Today';
      else if (isYesterday(date)) dateKey = 'Yesterday';
      else dateKey = format(date, 'MMMM d, yyyy');
      
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5] relative overflow-hidden">
      {/* Background Pattern (WhatsApp like) */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat" />

      {/* Header */}
      <div className="bg-[#F0F2F5] px-4 py-2.5 flex items-center justify-between border-b border-black/5 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-black/5 rounded-full text-[#54656F]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${primaryBg}`}>
              {isShopOwner ? (
                thread.customer_name?.charAt(0).toUpperCase() || 'C'
              ) : (
                shop.name.charAt(0).toUpperCase()
              )}
            </div>
            
            <div className="flex flex-col">
              <h2 className="font-semibold text-[#111B21] text-sm leading-tight">
                {isShopOwner ? thread.customer_name : shop.name}
              </h2>
              <div className="flex items-center gap-1.5 h-4">
                {isOtherTyping ? (
                  <span className="text-[11px] text-[#00A884] font-medium animate-pulse">typing...</span>
                ) : isOnline ? (
                  <span className="text-[11px] text-[#00A884] font-medium">online</span>
                ) : lastSeen ? (
                  <span className="text-[11px] text-[#667781]">last seen {format(new Date(lastSeen), 'HH:mm')}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-black/5 rounded-full text-[#54656F]">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-black/5 rounded-full text-[#54656F]">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-black/5 rounded-full text-[#54656F]">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2 z-10 scrollbar-thin scrollbar-thumb-black/10"
      >
        {Object.entries(groupMessages).map(([date, dateMessages]) => (
          <React.Fragment key={date}>
            <div className="flex justify-center my-4">
              <div className="bg-[#FFFFFF] px-3 py-1 rounded-lg shadow-sm text-[11px] font-medium text-[#54656F] uppercase tracking-wider border border-black/5">
                {date}
              </div>
            </div>
            
            {(dateMessages as ChatMessage[]).map((msg, idx) => {
              const isMe = isShopOwner ? msg.sender_role === 'shop_owner' : msg.sender_role === 'customer';
              const showTail = idx === 0 || (dateMessages as ChatMessage[])[idx-1].sender_role !== msg.sender_role;
              
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
                >
                  <div className={`group relative max-w-[85%] px-3 py-1.5 rounded-xl shadow-sm ${
                    isMe 
                      ? 'bg-[#D9FDD3] text-[#111B21] rounded-tr-none' 
                      : 'bg-white text-[#111B21] rounded-tl-none'
                  }`}>
                    {/* Reply Context */}
                    {msg.reply_to_id && (
                      <div className="bg-black/5 rounded-md p-2 mb-1 border-l-4 border-emerald-500 overflow-hidden">
                        <p className="text-[10px] font-bold text-emerald-600">Replied Message</p>
                        <p className="text-[11px] text-[#54656F] truncate">
                          {messages.find(m => m.id === msg.reply_to_id)?.message || 'Image Attachment'}
                        </p>
                      </div>
                    )}

                    {msg.message_type === 'text' && (
                      <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    )}

                    {msg.message_type === 'image' && (
                      <div className="rounded-lg overflow-hidden my-1 bg-black/5 min-h-[150px] flex items-center justify-center">
                        <img 
                          src={msg.image_url} 
                          alt="shared" 
                          className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(msg.image_url!)}
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (img.complete) scrollToBottom();
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-0.5 ml-8">
                      <span className="text-[10px] text-[#667781] font-medium uppercase">
                        {formatMessageTime(msg.created_at)}
                      </span>
                      {isMe && (
                        msg.is_read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5 text-[#667781]" />
                        )
                      )}
                    </div>

                    {/* Quick Action Overlay */}
                    <div className={`absolute top-0 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                      <button 
                        onClick={() => setReplyingTo(msg)}
                        className="p-1 bg-white rounded-full shadow-md text-[#54656F] hover:text-[#111B21]"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 bg-white rounded-full shadow-md text-[#54656F] hover:text-[#111B21]">
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-[#F0F2F5] p-3 border-t border-black/5 z-20">
        {/* Reply Preview */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-xl p-3 mb-2 border-l-4 border-emerald-500 flex justify-between items-center"
            >
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-emerald-600">Replying to {replyingTo.sender_role}</p>
                <p className="text-xs text-[#54656F] truncate">{replyingTo.message || 'Image Attachment'}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-black/5 rounded-full">
                <X className="w-4 h-4 text-[#54656F]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="relative" ref={emojiPickerRef}>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-[#54656F] hover:bg-black/5 rounded-full"
              >
                <Smile className="w-6 h-6" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-50">
                  <EmojiPicker 
                    onEmojiClick={(e) => {
                      setNewMessage(prev => prev + e.emoji);
                      setShowEmojiPicker(false);
                    }}
                    theme={EmojiTheme.LIGHT}
                    skinTonesDisabled
                    width={300}
                    height={400}
                  />
                </div>
              )}
            </div>
            
            <label className="p-2 text-[#54656F] hover:bg-black/5 rounded-full cursor-pointer">
              <Paperclip className="w-6 h-6" />
              <input type="file" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
            <div className="flex-1 bg-white rounded-xl px-4 py-2 shadow-sm border border-black/5">
              <input 
                type="text"
                placeholder="Type a message"
                value={newMessage}
                onChange={handleTyping}
                className="w-full bg-transparent border-none outline-none text-[15px] text-[#111B21] placeholder:text-[#667781]"
              />
            </div>
            
            {newMessage.trim() ? (
              <button 
                type="submit"
                disabled={sending}
                className={`w-11 h-11 rounded-full text-white flex items-center justify-center shadow-md transition-all active:scale-90 ${primaryBg}`}
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button 
                type="button"
                className="w-11 h-11 rounded-full bg-[#00A884] text-white flex items-center justify-center shadow-md"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Quick Reply Chips */}
      {!newMessage.trim() && (
        <div className="bg-[#F0F2F5] px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide z-20">
          {(isShopOwner ? ownerQuickReplies : customerQuickReplies).map(reply => (
            <button
              key={reply}
              onClick={() => {
                setNewMessage(reply);
                // Trigger auto send if needed or just fill input
              }}
              className="bg-white border border-black/5 text-[#54656F] text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm hover:bg-[#F0F2F5] transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col p-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setSelectedImage(null)} className="p-2 text-white hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
              <button className="p-2 text-white hover:bg-white/10 rounded-full">
                <Download className="w-6 h-6" />
              </button>
              <button className="p-2 text-white hover:bg-white/10 rounded-full">
                <Forward className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <img src={selectedImage} alt="Fullscreen" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

const ownerQuickReplies = [
  'Welcome to our shop!',
  'How can I help you?',
  'Slot is available at 2 PM',
  'Price for haircut is ₹300',
  'We are closed on Mondays',
  'Sure, looking forward!'
];

const customerQuickReplies = [
  'I want to book a slot',
  'What is the price?',
  'Is slot available today?',
  'Share shop location',
  'Thank you!',
  'Can I cancel?'
];
