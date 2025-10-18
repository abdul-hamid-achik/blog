"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts"

export type ChartConfig = Record<
    string,
    { label?: string; color?: string }
>

export function ChartContainer({
    children,
    className,
    config,
}: {
    children: React.ReactNode
    className?: string
    config?: ChartConfig
}) {
    // Expose CSS vars like --color-desktop for Recharts fills
    const style: React.CSSProperties = {}
    if (config) {
        for (const [key, value] of Object.entries(config)) {
            if (value?.color) {
                ; (style as any)[`--color-${key}`] = value.color
            }
        }
    }

    return (
        <div className={cn("h-[200px] w-full", className)} style={style}>
            {children}
        </div>
    )
}

export function ChartTooltip({
    content,
    ...props
}: React.ComponentProps<typeof RechartsTooltip>) {
    return <RechartsTooltip content={content} {...props} />
}

export function ChartTooltipContent({
    labelKey,
    nameKey,
}: {
    labelKey?: string
    nameKey?: string
}) {
    return (
        <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
            <div data-role="chart-tooltip" data-label-key={labelKey} data-name-key={nameKey} />
        </div>
    )
}

export function ChartLegend({
    content,
    ...props
}: React.ComponentProps<typeof RechartsLegend>) {
    return <RechartsLegend content={content} {...props} />
}

export function ChartLegendContent() {
    return <div data-role="chart-legend" />
}


