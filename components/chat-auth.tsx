"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";
import { gql, useMutation } from "@apollo/client";
import { cn } from "@/lib/utils";

const REQUEST_MAGIC_LINK_MUTATION = gql`
  mutation RequestMagicLink($email: String!) {
    requestMagicLink(email: $email) {
      success
      message
    }
  }
`;

interface ChatAuthProps {
    onSuccess?: () => void;
    className?: string;
}

export function ChatAuth({ onSuccess, className }: ChatAuthProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const [requestMagicLink] = useMutation(REQUEST_MAGIC_LINK_MUTATION);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) return;

        setIsLoading(true);
        setMessage("");

        try {
            const { data } = await requestMagicLink({
                variables: { email: email.trim() }
            });

            if (data?.requestMagicLink?.success) {
                setIsSuccess(true);
                setMessage(data.requestMagicLink.message);
                onSuccess?.();
            } else {
                setMessage(data?.requestMagicLink?.message || "Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error('Error requesting magic link:', error);
            setMessage("Failed to send verification email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className={cn("p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg", className)}>
                <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">
                            Check your email!
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg", className)}>
            <div className="flex items-start gap-3 mb-4">
                <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                    <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                        Email verification required
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        You&apos;ve used all 5 free messages. Enter your email to continue chatting.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="w-full"
                        required
                    />
                </div>

                {message && (
                    <p className={cn(
                        "text-sm",
                        isSuccess
                            ? "text-green-700 dark:text-green-300"
                            : "text-red-700 dark:text-red-300"
                    )}>
                        {message}
                    </p>
                )}

                <Button
                    type="submit"
                    disabled={!email.trim() || isLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send verification link
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
