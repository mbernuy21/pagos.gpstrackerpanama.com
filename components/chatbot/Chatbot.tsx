

import React, { useState, useRef, useEffect, useContext } from 'react';
import { Bot, Send, User, X, Zap, BrainCircuit, Loader } from 'lucide-react';
import { getChatbotResponse } from '../../services/geminiService';
import { DataContext } from '../../hooks/DataContext';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
};

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.sender === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    <Bot size={20} />
                </div>
            )}
            <div className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md ${isUser ? 'bg-primary-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 rounded-bl-none'}`}>
               <p className="text-sm" dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br />') }}></p>
            </div>
             {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200">
                    <User size={20} />
                </div>
            )}
        </div>
    );
};


export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "¡Hola! ¿Cómo puedo ayudarte a gestionar tus cobros hoy?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isThinkingMode, setIsThinkingMode] = useState(false);
    const dataContext = useContext(DataContext);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const newUserMessage: Message = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        if (!dataContext) {
            setMessages(prev => [...prev, { id: Date.now()+1, text: "El contexto de datos no está disponible.", sender: 'bot' }]);
            setIsLoading(false);
            return;
        }

        // FIX: Explicitly type historyForApi to match the expected type in getChatbotResponse.
        const historyForApi: { role: 'user' | 'model'; parts: { text: string }[] }[] = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const botResponseText = await getChatbotResponse(historyForApi, input, isThinkingMode, dataContext.clients, dataContext.payments);
        const newBotMessage: Message = { id: Date.now() + 1, text: botResponseText, sender: 'bot' };
        
        setMessages(prev => [...prev, newBotMessage]);
        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-transform transform hover:scale-110 z-50"
                aria-label="Abrir chatbot"
            >
                {isOpen ? <X size={24} /> : <Bot size={24} />}
            </button>

            {isOpen && (
                <div className="fixed bottom-20 right-6 w-[calc(100%-3rem)] sm:w-96 h-[60vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col z-40 animate-fade-in-up">
                    <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold">Asistente de IA</h3>
                             <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                {isThinkingMode ? <BrainCircuit size={14} className="mr-1 text-primary-400"/> : <Zap size={14} className="mr-1 text-yellow-400"/>}
                                {isThinkingMode ? "Modo Pensamiento (Pro)" : "Modo Rápido (Flash)"}
                             </div>
                        </div>
                        <label htmlFor="thinking-toggle" className="flex items-center cursor-pointer">
                            <span className="mr-2 text-sm">Modo Pensamiento</span>
                             <div className="relative">
                                <input id="thinking-toggle" type="checkbox" className="sr-only" checked={isThinkingMode} onChange={() => setIsThinkingMode(!isThinkingMode)} />
                                <div className="block bg-slate-200 dark:bg-slate-600 w-10 h-6 rounded-full"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isThinkingMode ? 'translate-x-full bg-primary-500' : ''}`}></div>
                             </div>
                        </label>
                    </header>
                    <main className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                        {isLoading && <div className="flex justify-start"><Loader className="animate-spin text-primary-500" /></div>}
                        <div ref={messagesEndRef} />
                    </main>
                    <footer className="p-4 border-t dark:border-slate-700">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Pregunta lo que sea..."
                                className="w-full pl-3 pr-12 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/50 disabled:text-slate-400 disabled:hover:bg-transparent">
                                <Send size={20} />
                            </button>
                        </div>
                    </footer>
                </div>
            )}
            {/* FIX: Removed unsupported 'jsx' prop from style tag. This syntax is specific to frameworks like Next.js. */}
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
};
