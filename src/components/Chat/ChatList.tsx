import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  User,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { ChatRoom, Shop } from '../../types';
import { format } from 'date-fns';

interface ChatListProps {
  shop: Shop;
  onBack: () => void;
  onSelectRoom: (room: ChatRoom) => void;
  isShopOwner: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({ shop, onBack, onSelectRoom, isShopOwner }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRooms();

    // Subscribe to chat room updates
    const channel = supabase
      .channel('chat_rooms_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_threads',
          filter: isShopOwner ? `shop_id=eq.${shop.id}` : `customer_id=eq.${(supabase.auth.getUser() as any).data.user?.id}`
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shop.id, isShopOwner]);

    const fetchRooms = async () => {
    try {
      console.log('Fetching threads for shop:', shop.id, 'isShopOwner:', isShopOwner);
      let query = supabase
        .from('chat_threads')
        .select('*');
        
      if (isShopOwner) {
        query = query.eq('shop_id', shop.id);
      } else {
        const user = (await supabase.auth.getUser()).data.user;
        query = query.eq('customer_id', user?.id);
      }
      
      const { data, error } = await query.order('last_message_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching chat threads:', error);
        throw error;
      }
      console.log('Fetched threads:', data);
      setRooms(data || []);
    } catch (err) {
      console.error('Error fetching chat threads:', err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.customer_phone && room.customer_phone.includes(searchQuery))
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 border-b sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Chats</h1>
          <p className="text-sm text-slate-500">{rooms.length} conversations</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500">Loading conversations...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No chats yet</h3>
            <p className="text-slate-500 mt-2">
              When customers message your shop, they will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y bg-white">
            {filteredRooms.map((room) => (
              <motion.button
                key={room.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => onSelectRoom(room)}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="relative">
                  <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-7 h-7 text-indigo-600" />
                  </div>
                  {room.unread_count_shop > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                      {room.unread_count_shop}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-900 truncate">
                      {room.customer_name}
                    </h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {room.updated_at ? format(new Date(room.updated_at), 'hh:mm a') : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 truncate pr-4">
                      {room.last_message || 'No messages yet'}
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
