"use client";

import * as React from "react";
import {
  Tooltip as RechartsTooltip,
  type TooltipContentProps,
  type TooltipPayloadEntry,
  type TooltipValueType,
} from "recharts";

import { cn } from "@/lib/utils";

type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>;

type ChartStyle = React.CSSProperties &
  Record<`--color-${string}`, string | undefined>;

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  config?: ChartConfig;
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  ChartContainerProps
>(function ChartContainer(
  { children, className, config, style, ...props },
  ref,
) {
  const chartStyle: ChartStyle = {};

  for (const [key, value] of Object.entries(config ?? {})) {
    if (value.color) chartStyle[`--color-${key}`] = value.color;
  }

  return (
    <div
      ref={ref}
      data-slot="chart"
      className={cn(
        "h-52 w-full text-xs",
        "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
        "[&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-offset-4 [&_.recharts-surface:focus-visible]:outline-primary",
        className,
      )}
      style={{ ...chartStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  );
});

export function ChartTooltip({
  content,
  ...props
}: React.ComponentProps<typeof RechartsTooltip>) {
  return (
    <RechartsTooltip
      content={content}
      isAnimationActive="auto"
      wrapperStyle={{ outline: "none", zIndex: 20 }}
      {...props}
    />
  );
}

interface ChartTooltipContentProps extends Partial<
  TooltipContentProps<TooltipValueType, string | number>
> {
  config?: ChartConfig;
  valueFormatter?: (
    value: TooltipValueType,
    item: TooltipPayloadEntry,
  ) => React.ReactNode;
}

function defaultValueFormatter(value: TooltipValueType) {
  return Array.isArray(value) ? value.join("–") : value;
}

export function ChartTooltipContent({
  active = false,
  config,
  label,
  payload = [],
  valueFormatter = defaultValueFormatter,
}: ChartTooltipContentProps) {
  if (!active || payload.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-w-32 rounded-md border border-border bg-background px-3 py-2.5 text-xs text-foreground shadow-md"
    >
      {label !== undefined && label !== null ? (
        <p className="mb-2 max-w-56 truncate font-medium text-foreground">
          {label}
        </p>
      ) : null}

      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          if (item.value === undefined) return null;

          const dataKey =
            typeof item.dataKey === "string" || typeof item.dataKey === "number"
              ? String(item.dataKey)
              : undefined;
          const itemConfig = dataKey ? config?.[dataKey] : undefined;
          const itemLabel = itemConfig?.label ?? item.name;
          const itemColor =
            itemConfig?.color ?? item.color ?? item.fill ?? "var(--primary)";

          return (
            <div
              key={`${item.graphicalItemId}-${dataKey ?? index}`}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2"
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full"
                style={{ backgroundColor: itemColor }}
              />
              {itemLabel !== undefined ? (
                <span className="truncate text-muted-foreground">
                  {itemLabel}
                </span>
              ) : (
                <span />
              )}
              <span className="font-medium tabular-nums text-foreground">
                {valueFormatter(item.value, item)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
