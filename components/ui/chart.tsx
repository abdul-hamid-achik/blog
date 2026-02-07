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

export function ChartTooltipContent({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) {
        return null
    }

    return (
        <div className="rounded-lg border bg-background p-2 shadow-xs text-sm">
            <div className="grid gap-2">
                {label && <div className="font-medium">{label}</div>}
                {payload.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground">{item.name}:</span>
                        <span className="font-bold">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function ChartLegend(props: Omit<React.ComponentProps<typeof RechartsLegend>, 'ref'>) {
    return <RechartsLegend {...props} />
}

export function ChartLegendContent({ payload }: any) {
    if (!payload || !payload.length) {
        return null
    }

    return (
        <div className="flex items-center justify-center gap-4">
            {payload.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                    <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                </div>
            ))}
        </div>
    )
}


