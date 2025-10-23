"use client"

import { useEffect, useRef } from "react";
import { Loader2, ExternalLink, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChatAuth } from "@/components/chat-auth";

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatMessagesProps {
    messages: Message[];
    isLoading?: boolean;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    } | null;
    onAuthSuccess?: () => void;
}

// Parse message content and convert [NAVIGATE:/path] to clickable links
function parseMessageContent(content: string) {
    const parts = [];
    let lastIndex = 0;
    const regex = /\[NAVIGATE:(\/[^\]]+)\]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        // Add text before the link
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                content: content.substring(lastIndex, match.index)
            });
        }

        // Add the link
        parts.push({
            type: 'link',
            path: match[1]
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push({
            type: 'text',
            content: content.substring(lastIndex)
        });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
}

export function ChatMessages({ messages, isLoading = false, usage, onAuthSuccess }: ChatMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">
                    <div className="text-center space-y-2">
                        <p>👋 Hi! I&apos;m your AI assistant.</p>
                        <p className="text-xs">Ask me anything about this blog!</p>
                    </div>
                </div>
            )}

            {messages.filter(m => m.role !== 'system').map((message, index) => {
                const contentParts = parseMessageContent(message.content);
                const isAuthPrompt = message.role === 'assistant' &&
                    (message.content.includes('🔒') || message.content.includes('email address'));

                return (
                    <div
                        key={index}
                        className={cn(
                            "flex w-full",
                            message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm",
                                message.role === 'user'
                                    ? "bg-slate-900 dark:bg-slate-700 text-white"
                                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-700"
                            )}
                        >
                            {isAuthPrompt ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                        <Lock className="h-4 w-4" />
                                        <span className="font-medium">Authentication Required</span>
                                    </div>
                                    <div className="whitespace-pre-wrap break-words">
                                        {message.content}
                                    </div>
                                    <ChatAuth onSuccess={onAuthSuccess} />
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap break-words space-y-2">
                                    {contentParts.map((part: any, i: number) => {
                                        if (part.type === 'link') {
                                            return (
                                                <Link
                                                    key={i}
                                                    href={part.path}
                                                    className="inline-flex items-center gap-1 text-slate-900 dark:text-slate-100 hover:underline font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded"
                                                    onClick={() => {
                                                        // Close chat when navigating
                                                        window.dispatchEvent(new CustomEvent('close-chat'));
                                                    }}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    View
                                                </Link>
                                            );
                                        }
                                        return <span key={i}>{part.content}</span>;
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-900 dark:text-slate-50" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">Thinking...</span>
                        </div>
                    </div>
                </div>
            )}

            {usage && usage.totalTokens && usage.totalTokens > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
                    Tokens used: {usage.totalTokens}
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}

