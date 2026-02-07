"use client"

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function ChatInput({
    onSend,
    disabled = false,
    placeholder = "Type a message..."
}: ChatInputProps) {
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const maxChars = 500;
    const remainingChars = maxChars - message.length;

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
        }
    }, [message]);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage("");
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-border p-4 bg-background">
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, maxChars))}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="resize-none min-h-[60px] max-h-[100px] bg-muted border-border text-foreground placeholder:text-muted-foreground"
                        rows={1}
                    />
                    {message.length > maxChars - 50 && (
                        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-muted px-1 rounded">
                            {remainingChars}
                        </div>
                    )}
                </div>
                <Button
                    onClick={handleSend}
                    disabled={!message.trim() || disabled}
                    size="icon"
                    className="h-[60px] w-[60px] bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
                Press Enter to send, Shift+Enter for new line
            </div>
        </div>
    );
}

