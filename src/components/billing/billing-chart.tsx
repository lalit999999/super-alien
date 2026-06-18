"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: Array<{ date: string; tokens: number }>;
}

export function BillingChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-ps-muted">
        No token usage recorded this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6A89A7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6A89A7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#384959" strokeOpacity={0.2} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#6A89A7" }}
          tickFormatter={(v: string) => v.slice(5)}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6A89A7" }}
          tickLine={false}
          axisLine={false}
          width={45}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
        />
        <Tooltip
          contentStyle={{
            background: "#1a2535",
            border: "1px solid #384959",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#88BDF2" }}
          itemStyle={{ color: "#BDDDFC" }}
          formatter={(v) => [(v as number).toLocaleString(), "Tokens"]}
        />
        <Area
          type="monotone"
          dataKey="tokens"
          stroke="#6A89A7"
          strokeWidth={2}
          fill="url(#tokenGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
