"use client"

import type { ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { ChartDataItem } from '@/lib/types';
import { cn } from "@/lib/utils"; // Added import

interface InteractiveBarChartProps {
  data: ChartDataItem[];
  chartConfig?: ChartConfig;
  title?: string;
  className?: string;
  barDataKey?: string;
  xAxisDataKey?: string;
}

const defaultChartConfig = {
  value: {
    label: "Count",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function InteractiveBarChart({
  data,
  chartConfig = defaultChartConfig,
  title,
  className,
  barDataKey = "value",
  xAxisDataKey = "name",
}: InteractiveBarChartProps) {
  
  if (!data || data.length === 0) {
    return (
      <div className={cn("h-[250px] w-full flex items-center justify-center text-muted-foreground", className)}>
        No data to display
      </div>
    );
  }

  return (
    <div className={cn("h-[250px] w-full", className)}>
      {title && <h3 className="text-center text-lg font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey={xAxisDataKey} 
            tickLine={false} 
            axisLine={false} 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            angle={-35}
            textAnchor="end"
            height={50}
            interval={0} 
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "hsla(var(--muted), 0.5)" }}
            contentStyle={{ 
              backgroundColor: "hsl(var(--background))", 
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--foreground))"
            }}
          />
          {chartConfig.value.label && <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '10px'}}/>}
          <Bar dataKey={barDataKey} fillKey="color" fill={chartConfig[barDataKey as keyof typeof chartConfig]?.color || "hsl(var(--chart-1))"} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
