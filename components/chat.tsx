"use client"

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ChatBubble } from "@/components/chat-bubble";
import { ChatMessages, Message } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { v4 as uuid } from 'uuid';
import { cn } from "@/lib/utils";

export function Chat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState<string>("");
    const [usage, setUsage] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize or retrieve session ID
    useEffect(() => {
        let sid = sessionStorage.getItem('chat-session-id');
        if (!sid) {
            sid = uuid();
            sessionStorage.setItem('chat-session-id', sid);
        }
        setSessionId(sid);

        // Load chat history from sessionStorage
        const savedMessages = sessionStorage.getItem('chat-messages');
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            } catch (e) {
                console.error('Failed to parse saved messages');
            }
        }
    }, []);

    // Save messages to sessionStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem('chat-messages', JSON.stringify(messages));
        }
    }, [messages]);

    // Listen for close-chat event from navigation links
    useEffect(() => {
        const handleCloseChat = () => setIsOpen(false);
        window.addEventListener('close-chat', handleCloseChat);
        return () => window.removeEventListener('close-chat', handleCloseChat);
    }, []);

    // Add welcome message when chat opens for the first time
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage: Message = {
                role: 'assistant',
                content: "You are speaking to Mr. Smerdyakov, Dostoyevsky's character. I suppose you have questions about this philosophical blog of yours. What would you like to discuss?"
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, messages.length]);

    const handleSendMessage = async (content: string) => {
        const userMessage: Message = {
            role: 'user',
            content
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Create assistant message placeholder for streaming
        const assistantMessage: Message = {
            role: 'assistant',
            content: ''
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const history = messages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role, content: m.content }));

            // Get current page URL (without domain)
            const currentPageUrl = typeof window !== 'undefined' ? window.location.pathname : '';

            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: content,
                    sessionId,
                    history,
                    currentPageUrl
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            setIsLoading(false);
                            return;
                        }

                        if (data === '{"type":"start"}') {
                            // Stream started, continue
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) {
                                throw new Error(parsed.error);
                            }

                            // Update the last message (assistant message) with streamed content
                            setMessages(prev => {
                                const updated = [...prev];
                                const lastMessage = updated[updated.length - 1];
                                if (lastMessage.role === 'assistant') {
                                    lastMessage.content += parsed;
                                }
                                return updated;
                            });
                        } catch (parseError) {
                            // If it's not JSON, treat as plain text
                            setMessages(prev => {
                                const updated = [...prev];
                                const lastMessage = updated[updated.length - 1];
                                if (lastMessage.role === 'assistant') {
                                    lastMessage.content += data;
                                }
                                return updated;
                            });
                        }
                    }
                }
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Chat streaming error:', error);
            setIsLoading(false);

            // Update the assistant message with error
            setMessages(prev => {
                const updated = [...prev];
                const lastMessage = updated[updated.length - 1];
                if (lastMessage.role === 'assistant') {
                    lastMessage.content = 'Sorry, I encountered an error. Please try again.';
                }
                return updated;
            });
        }
    };

    const handleClearChat = () => {
        setMessages([]);
        sessionStorage.removeItem('chat-messages');
        setUsage(null);
    };

    return (
        <>
            {!isOpen && <ChatBubble onClick={() => setIsOpen(true)} />}

            {/* Chat Window - Bottom Right Corner */}
            <div
                className={cn(
                    "fixed bottom-4 right-4 z-[9998] transition-all duration-300 ease-in-out",
                    isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                )}
            >
                <div className="w-[380px] h-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse shadow-sm shadow-green-500/50" />
                            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Concierge</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {messages.length > 0 && (
                                <button
                                    onClick={handleClearChat}
                                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                    title="Clear chat"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                title="Close chat"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <ChatMessages
                        messages={messages}
                        isLoading={isLoading}
                        usage={usage}
                        onAuthSuccess={() => {
                            // Refresh the page to get updated auth state
                            window.location.reload();
                        }}
                    />

                    <ChatInput
                        onSend={handleSendMessage}
                        disabled={isLoading}
                        placeholder="Ask me anything..."
                    />
                </div>
            </div>
        </>
    );
}
