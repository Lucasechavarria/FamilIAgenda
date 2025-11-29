import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Minimize2, Maximize2, Bell, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/auth';

interface Message {
    id?: number;
    user_id?: number;
    user_name?: string;
    content?: string; // Para chat normal
    message?: string; // Para notificaciones
    title?: string;   // Para notificaciones
    created_at?: string;
    type?: 'chat' | 'notification';
    severity?: 'info' | 'warning' | 'error';
}

export const ChatWidget: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al final
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setUnreadCount(0);
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (!user) return;

        // Cargar historial
        loadHistory();

        // Conectar WebSocket
        const token = localStorage.getItem('access_token');
        // Determinar URL del WebSocket dinámicamente
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
        const wsHost = apiUrl.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}://${wsHost}/api/chat/ws/${user.family_id || 1}/${token}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Chat conectado");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'chat') {
                setMessages(prev => [...prev, data]);
                if (!isOpen) setUnreadCount(prev => prev + 1);
            } else if (data.type === 'notification') {
                // Manejar notificación
                handleNotification(data);
                // También agregar al chat como mensaje de sistema
                setMessages(prev => [...prev, { ...data, created_at: new Date().toISOString() }]);
                if (!isOpen) setUnreadCount(prev => prev + 1);
            }
        };

        ws.onclose = () => {
            console.log("Chat desconectado");
            setIsConnected(false);
        };

        socketRef.current = ws;

        return () => {
            ws.close();
        };
    }, [user]); // Quitamos isOpen de deps para mantener conexión

    const loadHistory = async () => {
        if (!user?.family_id) return;
        try {
            const response = await api.get(`/api/chat/history/${user.family_id}`);
            setMessages(response.data);
        } catch (error) {
            console.error("Error cargando historial:", error);
        }
    };

    const handleNotification = (data: Message) => {
        // 1. Notificación Nativa del Navegador
        if (Notification.permission === "granted") {
            new Notification(data.title || "Alerta FamilIAgenda", {
                body: data.message,
                icon: "/pwa-192x192.png" // Asegúrate de tener un icono
            });
        }

        // 2. Audio (Opcional)
        // const audio = new Audio('/notification.mp3');
        // audio.play().catch(e => console.log("Audio play failed", e));
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current) return;

        const messageData = {
            content: newMessage
        };

        socketRef.current.send(JSON.stringify(messageData));
        setNewMessage('');
    };

    if (!user) return null;

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex flex-col items-end transition-all duration-300 ${isOpen ? 'w-80 md:w-96' : 'w-auto'}`}>

            {/* Botón Flotante (cuando está cerrado) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative w-14 h-14 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 animate-bounce-slow"
                >
                    <MessageCircle size={28} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* Ventana de Chat */}
            {isOpen && (
                <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="p-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={20} />
                            <span className="font-bold text-sm">Chat Familiar</span>
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} title={isConnected ? "Conectado" : "Desconectado"}></span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <Minimize2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Área de Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50 custom-scrollbar">
                        {messages.map((msg, idx) => {
                            if (msg.type === 'notification') {
                                return (
                                    <div key={idx} className="flex justify-center my-2">
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-3 max-w-[90%] flex items-start gap-3 shadow-sm">
                                            <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/50 rounded-full text-yellow-600 dark:text-yellow-400">
                                                <AlertTriangle size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-yellow-800 dark:text-yellow-200">{msg.title}</p>
                                                <p className="text-xs text-yellow-700 dark:text-yellow-300">{msg.message}</p>
                                                <span className="text-[10px] text-yellow-500/80 mt-1 block">
                                                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            const isMe = msg.user_id === parseInt(user.id);
                            return (
                                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                        ? 'bg-primary-500 text-white rounded-br-none'
                                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none border border-gray-100 dark:border-slate-600'
                                        }`}>
                                        {!isMe && <p className="text-[10px] font-bold opacity-70 mb-0.5">{msg.user_name}</p>}
                                        <p>{msg.content}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 bg-gray-100 dark:bg-slate-700 text-slate-800 dark:text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !isConnected}
                            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
