"use client"

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface ChatBubbleProps {
    onClick: () => void;
    unreadCount?: number;
}

export function ChatBubble({ onClick, unreadCount = 0 }: ChatBubbleProps) {
    const [isTingling, setIsTingling] = useState(false);

    // Trigger tingling animation every 3-5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setIsTingling(true);
            setTimeout(() => setIsTingling(false), 1000);
        }, Math.random() * 2000 + 3000); // Random interval between 3-5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <button
            onClick={onClick}
            className="fixed bottom-4 right-4 z-[9999] h-14 w-14 rounded-full bg-slate-900 dark:bg-slate-700 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
            aria-label="Open chat"
        >
            <Bell
                className={`h-6 w-6 group-hover:scale-110 transition-transform ${isTingling ? 'animate-bounce' : ''
                    }`}
                style={{
                    animation: isTingling ? 'tingle 0.1s ease-in-out infinite alternate' : undefined
                }}
            />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-semibold animate-pulse shadow-md">
                    {unreadCount}
                </span>
            )}
            <span className="absolute inset-0 rounded-full bg-slate-900 dark:bg-slate-700 animate-ping opacity-20" />

            <style jsx>{`
                @keyframes tingle {
                    0% { transform: rotate(-5deg); }
                    100% { transform: rotate(5deg); }
                }
            `}</style>
        </button>
    );
}

