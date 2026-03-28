import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, MessageCircle, X, AlertTriangle,
  Smile, Wifi, WifiOff, ChevronDown, Sparkles, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/auth';
import { calendarService } from '../services/api';
import { cn } from '../lib/cn';
import { UXFeedback } from '../lib/UXInteractions';

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------
type MessageType  = 'chat' | 'notification' | 'typing';
type Severity     = 'info' | 'warning' | 'error';

interface ChatMessage {
  id?: number;
  user_id?: number;
  user_name?: string;
  content?: string;
  message?: string;
  title?: string;
  created_at?: string;
  type?: MessageType;
  severity?: Severity;
  is_aura?: boolean;
}

interface TypingUser {
  user_id: number;
  user_name: string;
}

// ------------------------------------------------------------------
// Emojis de acceso rápido
// ------------------------------------------------------------------
const QUICK_EMOJIS = ['😊', '👍', '❤️', '😂', '🎉', '👏', '🙏', '🔥'];

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const fmtTime = (iso?: string): string =>
  iso
    ? new Date(iso).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const getInitials = (name?: string): string =>
  (name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const avatarGradient = (name?: string): string => {
  const gradients = [
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
  ];
  const idx = (name?.charCodeAt(0) ?? 0) % gradients.length;
  return gradients[idx];
};

// ------------------------------------------------------------------
// Sub-componentes
// ------------------------------------------------------------------

const TypingIndicator: React.FC<{ users: TypingUser[] }> = ({ users }) => {
  if (users.length === 0) return null;
  const label =
    users.length === 1
      ? `${users[0].user_name} está escribiendo`
      : `${users.map((u) => u.user_name).join(', ')} están escribiendo`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-end gap-2 px-2"
      role="status"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
        {getInitials(users[0].user_name)}
      </div>
      <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-400"
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const NotificationBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex justify-center my-1"
  >
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-2.5 max-w-[90%] flex items-start gap-3 shadow-sm">
      <div className="p-1.5 bg-amber-100 dark:bg-amber-800/50 rounded-full text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
        <AlertTriangle size={13} aria-hidden="true" />
      </div>
      <div>
        {msg.title && (
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-0.5">
            {msg.title}
          </p>
        )}
        <p className="text-xs text-amber-700 dark:text-amber-300">{msg.message}</p>
        <time className="text-[10px] text-amber-500/80 mt-1 block">
          {fmtTime(msg.created_at)}
        </time>
      </div>
    </div>
  </motion.div>
);

const ChatBubble: React.FC<{ msg: ChatMessage; isMe: boolean }> = ({ msg, isMe }) => {
  const gradient = avatarGradient(msg.user_name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'flex gap-2',
        isMe ? 'flex-row-reverse' : 'flex-row',
        'items-end'
      )}
    >
      {!isMe && (
        <div
          className={cn(
            'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center',
            'text-white text-[10px] font-bold shadow-md bg-gradient-to-br',
            gradient
          )}
        >
          {getInitials(msg.user_name)}
        </div>
      )}

      <div className={cn('flex flex-col gap-1 max-w-[75%]', isMe && 'items-end')}>
        {!isMe && msg.user_name && (
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 px-1">
            {msg.user_name}
          </span>
        )}
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm shadow-md leading-relaxed',
            'break-words',
            isMe
              ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-br-sm shadow-primary-500/20'
              : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-gray-100 dark:border-slate-600/50'
          )}
        >
          {msg.content}
        </div>
        <time className="text-[10px] text-slate-400 dark:text-slate-500 px-1">
          {fmtTime(msg.created_at)}
        </time>
      </div>
    </motion.div>
  );
};

const AuraInsightBubble: React.FC<{ msg: ChatMessage; onApply?: () => void }> = ({ msg, onApply }) => (
  <motion.div
    initial={{ opacity: 0, x: -20, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    className="flex flex-col gap-2 my-2 items-start"
  >
    <div className="flex items-center gap-2 px-1">
        <Sparkles size={14} className="text-primary-400 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-400">Aura Insight</span>
    </div>
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-primary-500/30 rounded-2xl rounded-tl-none px-4 py-3 shadow-lg shadow-primary-500/10 max-w-[90%] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
        <Wand2 size={40} className="text-primary-500 -rotate-12 translate-x-4 -translate-y-4" />
      </div>
      <p className="text-sm text-slate-200 leading-relaxed relative z-10">{msg.content}</p>
      
      {msg.title && (
          <div className="mt-3 flex gap-2 relative z-10">
              <button 
                onClick={onApply}
                className="text-[10px] font-bold bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95"
              >
                  Optimizar ahora
              </button>
              <button className="text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-1.5 rounded-lg transition-all">
                  Luego
              </button>
          </div>
      )}
    </div>
  </motion.div>
);

const EmojiPicker: React.FC<{
  isOpen: boolean;
  onPickEmoji: (emoji: string) => void;
}> = ({ isOpen, onPickEmoji }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl shadow-2xl p-2 flex gap-1"
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPickEmoji(emoji)}
            className="w-9 h-9 text-xl rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-125 active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

// ------------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------------
export const ChatWidget: React.FC = () => {
  const { user } = useAuth();

  const [isOpen, setIsOpen]             = useState(false);
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage]     = useState('');
  const [isConnected, setIsConnected]   = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [typingUsers, setTypingUsers]   = useState<TypingUser[]>([]);
  const [showEmojis, setShowEmojis]     = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [auraInsights, setAuraInsights] = useState<any[]>([]);
  const [hasNewInsight, setHasNewInsight] = useState(false);

  const socketRef       = useRef<WebSocket | null>(null);
  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLInputElement>(null);
  const typingTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = () => {
    const el = messagesAreaRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!isNearBottom);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    if (!user) return;
    const fetchAura = async () => {
      try {
        const data = await calendarService.getProactiveInsights();
        if (data.insights?.length > 0) {
          setAuraInsights(data.insights);
          if (!isOpen) {
              setHasNewInsight(true);
              UXFeedback.vibrate('light');
          }
        }
      } catch (err) {
        console.error("Error Aura:", err);
      }
    };
    fetchAura();
    const interval = setInterval(fetchAura, 60000 * 5);
    return () => clearInterval(interval);
  }, [user, isOpen]);

  useEffect(() => {
    if (!user) return;
    loadHistory();
    const token    = localStorage.getItem('access_token');
    const apiUrl   = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const protocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const host     = apiUrl.replace(/^https?:\/\//, '');
    const wsUrl    = `${protocol}://${host}/api/chat/ws/${(user as { family_id?: number }).family_id ?? 1}/${token}`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as ChatMessage & { typing?: boolean };
      if ('typing' in data && data.typing) {
        const tUser: TypingUser = { user_id: data.user_id ?? 0, user_name: data.user_name ?? 'Alguien' };
        setTypingUsers(p => p.some(u => u.user_id === tUser.user_id) ? p : [...p, tUser]);
        setTimeout(() => setTypingUsers(p => p.filter(u => u.user_id !== tUser.user_id)), 3000);
        return;
      }
      if (data.type === 'chat') {
        setMessages(p => [...p, data]);
        if (!isOpen) setUnreadCount(p => p + 1);
      } else if (data.type === 'notification') {
        handleNotification(data);
        setMessages(p => [...p, { ...data, created_at: new Date().toISOString() }]);
        if (!isOpen) setUnreadCount(p => p + 1);
      }
    };
    ws.onclose = () => setIsConnected(false);
    socketRef.current = ws;
    return () => ws.close();
  }, [user]);

  const loadHistory = async () => {
    const familyId = (user as { family_id?: number } | null)?.family_id;
    if (!familyId) return;
    try {
      const res = await api.get<ChatMessage[]>(`/api/chat/history/${familyId}`);
      setMessages(res.data);
    } catch (err) { console.error('Error historial:', err); }
  };

  const handleNotification = (data: ChatMessage) => {
    if (Notification.permission === 'granted') {
      new Notification(data.title ?? 'Aura Insight', { body: data.message, icon: '/pwa-192x192.png' });
    }
  };

  const sendTypingSignal = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ typing: true }));
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ typing: false }));
      }
    }, 2000);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.length > 0) sendTypingSignal();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({ content: newMessage }));
    setNewMessage('');
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  const pickEmoji = (emoji: string) => {
    setNewMessage(p => p + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  if (!user) return null;
  const userId = parseInt((user as { id: string | number }).id as string, 10);

  return (
    <div className={cn('fixed bottom-4 right-4 z-50 flex flex-col items-end transition-all', isOpen ? 'w-80 md:w-96' : 'w-auto')}>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="chat-fab"
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className={cn('relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-600 text-white', hasNewInsight && 'ring-4 ring-primary-500/30 animate-pulse')}
          >
            <MessageCircle size={26} />
            {hasNewInsight && (
                <div className="absolute -top-2 -left-2 bg-primary-400 p-1.5 rounded-full shadow-lg border-2 border-slate-900 animate-bounce">
                    <Sparkles size={12} />
                </div>
            )}
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full flex flex-col h-[520px] rounded-3xl shadow-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-primary-600 to-secondary-600 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><MessageCircle size={18} className="text-white" /></div>
                <div><p className="text-white font-bold text-sm">Chat Familiar</p><p className="text-white/70 text-[10px] flex items-center gap-1">{isConnected ? 'Conectado' : 'Reconectando...'}</p></div>
              </div>
              <button onClick={() => { setIsOpen(false); setHasNewInsight(false); }} className="p-2 text-white"><X size={18} /></button>
            </div>

            <div ref={messagesAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-950/60">
               {messages.length === 0 && auraInsights.length === 0 && <p className="text-center text-slate-500 text-xs mt-10">¡Saluda a tu familia! 👋</p>}
               {auraInsights.map((insight, idx) => (
                  <AuraInsightBubble 
                    key={`aura-${idx}`} 
                    msg={{ content: insight.content, title: insight.id } as any} 
                    onApply={() => { UXFeedback.playSound('success'); setAuraInsights(p => p.filter(i => i.id !== insight.id)); }}
                  />
               ))}
               {messages.map((msg, idx) => msg.type === 'notification' ? <NotificationBubble key={idx} msg={msg} /> : <ChatBubble key={idx} msg={msg} isMe={msg.user_id === userId} />)}
               {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
               <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-slate-900 border-t border-white/5">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="relative">
                  <button type="button" onClick={() => setShowEmojis(!showEmojis)} className={cn('p-2 rounded-xl text-slate-400', showEmojis && 'bg-primary-500/20 text-primary-400')}><Smile size={18} /></button>
                  <EmojiPicker isOpen={showEmojis} onPickEmoji={pickEmoji} />
                </div>
                <input ref={inputRef} type="text" value={newMessage} onChange={handleInputChange} placeholder="Escribe un mensaje..." className="flex-1 bg-white/5 border border-white/10 text-slate-200 text-sm rounded-2xl px-4 py-2.5 outline-none focus:border-primary-500" />
                <button type="submit" disabled={!newMessage.trim() || !isConnected} className="p-2.5 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg disabled:opacity-40"><Send size={17} /></button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
