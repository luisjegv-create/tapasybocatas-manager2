import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, ChefHat, Sparkles } from 'lucide-react';
import { getChatHelpResponse, ChatMessage } from '../services/geminiService';

export const HelpChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: '¡Hola! Soy Benneti 👨‍🍳. ¿Necesitas ayuda con el TPV, el stock o alguna receta? Pregúntame.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    // Robust function to handle sending messages
    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg = text;
        
        // 1. Update UI immediately
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            // 2. Call API
            // Pass the CURRENT state of messages (before this update) to the service
            // The service handles adding the new user message to the context
            const response = await getChatHelpResponse(messages, userMsg);
            
            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Error de conexión. Inténtalo de nuevo." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputSend = () => {
        sendMessage(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleInputSend();
    };

    const suggestions = [
        "¿Cómo registro una merma?",
        "¿Cómo funciona el monitor?",
        "Añadir un nuevo vino",
        "Cerrar caja Z"
    ];

    return (
        <>
            {/* FLOATING BUTTON */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all hover:scale-110 active:scale-95 border-2 border-orange-500 group"
                    title="Ayuda / Benneti"
                >
                    <div className="relative">
                        <Bot size={32} />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>
                    </div>
                    <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-slate-800 text-sm font-bold px-3 py-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-200">
                        ¿Necesitas ayuda?
                    </span>
                </button>
            )}

            {/* CHAT WINDOW */}
            {isOpen && (
                <div className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-bottom-10 fade-in duration-300">
                    
                    {/* Header */}
                    <div className="bg-slate-900 p-5 flex justify-between items-center text-white">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-500 p-2 rounded-xl">
                                <ChefHat size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Benneti Asistente</h3>
                                <p className="text-xs text-slate-300 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> En línea
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-xl text-base font-medium leading-relaxed shadow-sm
                                    ${msg.role === 'user' 
                                        ? 'bg-orange-600 text-white rounded-br-none' 
                                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'}
                                `}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 p-4 rounded-xl rounded-bl-none shadow-sm flex items-center gap-2">
                                    <Sparkles size={20} className="text-orange-500 animate-spin" />
                                    <span className="text-sm text-slate-500 font-bold">Benneti está escribiendo...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {!isLoading && (
                        <div className="px-5 pb-2 bg-slate-50 flex gap-2 overflow-x-auto no-scrollbar py-2">
                            {suggestions.map((s, i) => (
                                <button 
                                    key={i}
                                    onClick={() => sendMessage(s)} 
                                    className="whitespace-nowrap bg-white border border-slate-300 text-slate-700 text-sm font-bold px-4 py-2 rounded-full hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 transition-colors shadow-sm"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe tu duda aquí..."
                                disabled={isLoading}
                                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none placeholder:text-slate-400 disabled:opacity-50"
                            />
                            <button 
                                onClick={handleInputSend}
                                disabled={!input.trim() || isLoading}
                                className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-md"
                            >
                                <Send size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};