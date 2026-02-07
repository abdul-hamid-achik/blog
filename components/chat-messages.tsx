"use client"

import { useEffect, useRef, useMemo } from "react";
import { Loader2, ExternalLink, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChatAuth } from "@/components/chat-auth";
import Markdown from "react-markdown";

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

// Safe URL protocols for links
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

// Allowed domains for images (internal only)
const ALLOWED_IMAGE_DOMAINS = ['abdulachik.dev'];

function isSafeUrl(href: string | undefined): boolean {
    if (!href) return false;
    try {
        const url = new URL(href, window.location.origin);
        return ALLOWED_PROTOCOLS.includes(url.protocol);
    } catch {
        // Relative URLs are safe
        return href.startsWith('/') || href.startsWith('#');
    }
}

function isSafeImage(src: string | undefined): boolean {
    if (!src) return false;
    
    // Relative URLs (internal) are safe
    if (src.startsWith('/')) return true;
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return false;
    
    try {
        const url = new URL(src, window.location.origin);
        
        // Only allow https protocol for absolute URLs
        if (url.protocol !== 'https:') return false;
        
        // Check if hostname exactly matches allowed domains or is a valid subdomain
        // Split both hostname and domain into parts to ensure proper domain boundary matching
        return ALLOWED_IMAGE_DOMAINS.some(domain => {
            if (url.hostname === domain) return true;
            
            // For subdomain validation, ensure it's a proper subdomain
            // by checking that hostname ends with '.domain' (not just contains it)
            const domainParts = domain.split('.');
            const hostnameParts = url.hostname.split('.');
            
            // Hostname must have more parts than domain to be a subdomain
            if (hostnameParts.length <= domainParts.length) return false;
            
            // Check if the last N parts of hostname match the domain parts
            const hostnameEnd = hostnameParts.slice(-domainParts.length).join('.');
            return hostnameEnd === domain;
        });
    } catch {
        return false;
    }
}

// Extract a readable label from a navigation path
function getNavLabel(path: string): string {
    const segments = path.split('/').filter(Boolean);
    const slug = segments[segments.length - 1] || 'page';
    return slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// Split content into text segments and [NAVIGATE:/path] links
function parseMessageContent(content: string) {
    const parts: Array<{ type: 'text'; content: string } | { type: 'link'; path: string; label: string }> = [];
    let lastIndex = 0;
    const regex = /\[NAVIGATE:(\/[^\]]+)\]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
        }
        parts.push({ type: 'link', path: match[1], label: getNavLabel(match[1]) });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        parts.push({ type: 'text', content: content.substring(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
}

function AssistantMessageContent({ content }: { content: string }) {
    const parts = useMemo(() => parseMessageContent(content), [content]);

    return (
        <div className="break-words space-y-1">
            {parts.map((part, i) => {
                if (part.type === 'link') {
                    return (
                        <Link
                            key={i}
                            href={part.path}
                            className="inline-flex items-center gap-1 text-foreground hover:underline font-medium bg-muted px-2 py-0.5 rounded text-xs"
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('close-chat'));
                            }}
                        >
                            <ExternalLink className="h-3 w-3" />
                            {part.label}
                        </Link>
                    );
                }
                return (
                    <Markdown
                        key={i}
                        components={{
                            // Keep links styled consistently with URL validation
                            a: ({ href, children }) => {
                                if (!isSafeUrl(href)) {
                                    // Render as plain text if URL is unsafe
                                    return <span>{children}</span>;
                                }
                                return (
                                    <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                                        {children}
                                    </a>
                                );
                            },
                            // Only allow internal images to prevent tracking/privacy leaks
                            img: ({ src, alt }) => {
                                if (!isSafeImage(src)) {
                                    // Show blocked image indicator for accessibility
                                    // React automatically escapes JSX content, preventing XSS
                                    const label = alt ? `[Image: ${alt}]` : '[Image]';
                                    return <span className="text-muted-foreground italic">{label}</span>;
                                }
                                return (
                                    <img 
                                        src={src} 
                                        alt={alt || 'Image'} 
                                        className="max-w-full rounded border border-border my-1"
                                        loading="lazy"
                                    />
                                );
                            },
                            // Compact paragraphs for chat context
                            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
                            li: ({ children }) => <li className="mb-0.5">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => (
                                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-primary pl-2 italic opacity-80">{children}</blockquote>
                            ),
                        }}
                    >
                        {part.content}
                    </Markdown>
                );
            })}
        </div>
    );
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted">
            {messages.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    <div className="text-center space-y-2">
                        <p>Ask me anything about this blog.</p>
                    </div>
                </div>
            )}

            {messages.filter(m => m.role !== 'system').map((message, index) => {
                const isAuthPrompt = message.role === 'assistant' &&
                    (message.content.includes('\u{1F512}') || message.content.includes('email address'));

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
                                "max-w-[85%] rounded-lg px-4 py-2 text-sm shadow-xs",
                                message.role === 'user'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card text-card-foreground border border-border"
                            )}
                        >
                            {isAuthPrompt ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-warning">
                                        <Lock className="h-4 w-4" />
                                        <span className="font-medium">Authentication Required</span>
                                    </div>
                                    <div className="whitespace-pre-wrap break-words">
                                        {message.content}
                                    </div>
                                    <ChatAuth onSuccess={onAuthSuccess} />
                                </div>
                            ) : message.role === 'assistant' ? (
                                <AssistantMessageContent content={message.content} />
                            ) : (
                                <div className="whitespace-pre-wrap break-words">
                                    {message.content}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-xs">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                    </div>
                </div>
            )}

            {usage && usage.totalTokens && usage.totalTokens > 0 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                    Tokens used: {usage.totalTokens}
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}
