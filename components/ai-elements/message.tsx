"use client";

import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { memo, type ComponentProps } from "react";
import { Streamdown } from "streamdown";

export type MessageResponseProps = ComponentProps<typeof Streamdown>;

const streamdownPlugins = { cjk, code };

/** Official AI Elements renderer, tailored to the concierge's compact panel. */
export const MessageResponse = memo(
  ({ className, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn(
        "size-full text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      controls={{
        code: { copy: true, download: false },
        table: false,
      }}
      dir="auto"
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (previous, next) =>
    previous.children === next.children &&
    previous.isAnimating === next.isAnimating,
);

MessageResponse.displayName = "MessageResponse";
