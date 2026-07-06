import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  User,
  Clock,
  MoreVertical,
  CheckCheck,
  Archive,
  BellOff,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isValidUUID } from '../../lib/supabase';
import { ChatThread, Shop } from '../../types';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatListProps {
  shop: Shop;
  onBack: () => void;
  onSelectThread: (thread: ChatThread) => void;
  isShopOwner: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({ shop, onBack, onSelectThread, isShopOwner }) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');

  useEffect(() => {
    fetchThreads();

    const channel = supabase
      .channel('chat_list_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_threads'
      }, () => {
        fetchThreads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shop.id, isShopOwner]);

  const fetchThreads = async () => {
    try {
      let query = supabase.from('chat_threads').select('*');
        
      if (isShopOwner) {
        query = query.eq('shop_id', shop.id);
      } else {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;
        query = query.eq('customer_id', user.id);
      }
      
      const { data, error } = await query.order('last_message_at', { ascending: false });
      if (error) throw error;
      setThreads(data || []);
    } catch (err) {
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = (isShopOwner ? thread.customer_name || 'Customer' : shop.name)
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
      (thread.last_message || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = 
      activeTab === 'all' ? thread.status !== 'archived' :
      activeTab === 'unread' ? (isShopOwner ? thread.owner_unread > 0 : thread.customer_unread > 0) :
      activeTab === 'archived' ? thread.status === 'archived' : true;

    return matchesSearch && matchesTab;
  });

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yy');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-[#F0F2F5] px-4 pt-4 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 hover:bg-black/5 rounded-full">
              <ArrowLeft className="w-6 h-6 text-[#54656F]" />
            </button>
            <h1 className="text-xl font-bold text-[#111B21]">Chats</h1>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-black/5 rounded-full text-[#54656F]">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-black/5 rounded-full text-[#54656F]">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#54656F]" />
          </div>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFFFFF] border-none rounded-lg pl-10 pr-4 py-2 text-sm text-[#111B21] placeholder:text-[#667781] focus:ring-0 shadow-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['all', 'unread', 'archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors ${
                activeTab === tab 
                  ? 'bg-[#D9FDD3] text-[#008069]' 
                  : 'bg-white text-[#54656F] hover:bg-black/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-3 border-[#00A884] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-10 text-center bg-[#F8FAFC]">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md border border-black/5 relative z-10">
                <MessageCircle className="w-10 h-10 text-[#00A884]" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#D9FDD3] rounded-full flex items-center justify-center shadow-sm border-2 border-white z-20">
                <User className="w-5 h-5 text-[#00A884]" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-[#F0F2F5] rounded-full flex items-center justify-center shadow-sm border-2 border-white z-20">
                <BellOff className="w-4 h-4 text-[#54656F]" />
              </div>
            </motion.div>
            <h3 className="text-xl text-[#111B21] font-bold mb-2">No messages yet</h3>
            <p className="text-[#54656F] text-[15px] max-w-[260px] leading-relaxed mb-8">
              {searchQuery 
                ? "We couldn't find any chats matching your search." 
                : "When customers contact you about your services or bookings, their messages will appear here."}
            </p>
            {!searchQuery && (
              <button 
                onClick={onBack}
                className="bg-[#00A884] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#008f6f] transition-colors active:scale-95 flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                View Bookings
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#F0F2F5]">
            {filteredThreads.map((thread) => {
              const unreadCount = isShopOwner ? thread.owner_unread : thread.customer_unread;
              const name = isShopOwner ? thread.customer_name || 'Customer' : shop.name;
              
              return (
                <motion.button
                  key={thread.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => onSelectThread(thread)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F6F6] transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${isShopOwner ? 'bg-[#2563EB]' : 'bg-[#7C3AED]'}`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    {thread.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00A884] border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 border-b border-[#F0F2F5] pb-3 pt-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-[#111B21] truncate">
                        {name}
                      </h3>
                      <span className={`text-[11px] ${unreadCount > 0 ? 'text-[#00A884] font-bold' : 'text-[#667781]'}`}>
                        {formatTime(thread.last_message_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        {isShopOwner && thread.last_message && (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] flex-shrink-0" />
                        )}
                        <p className={`text-sm truncate ${unreadCount > 0 ? 'text-[#111B21] font-bold' : 'text-[#667781]'}`}>
                          {thread.is_typing ? (
                            <span className="text-[#00A884] italic">typing...</span>
                          ) : (
                            thread.last_message || 'No messages yet'
                          )}
                        </p>
                      </div>
                      
                      {unreadCount > 0 && (
                        <span className="bg-[#00A884] text-white text-[10px] font-black min-w-[20px] h-5 flex items-center justify-center px-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button for Shop Owner */}
      {isShopOwner && (
        <button className="absolute bottom-6 right-6 w-14 h-14 bg-[#00A884] rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform active:scale-95">
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
