"use client";

import type { CountryCode, StrategyResult } from "@/lib/engine";
import { formatCurrency } from "@/lib/format";
import {
  ACCOUNT_COLORS,
  chartAccountKeys,
  chartIncomeKeys,
} from "@/lib/labels";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ResultCharts({
  strategy,
  compareNaive,
  country = "US",
}: {
  strategy: StrategyResult;
  compareNaive?: StrategyResult;
  country?: CountryCode;
}) {
  const balanceKeys = chartAccountKeys(country);
  const incomeKeys = [...chartAccountKeys(country), ...chartIncomeKeys(country)];

  const balanceData = strategy.years.map((y) => {
    const row: Record<string, number> = { age: y.age };
    for (const key of balanceKeys) {
      row[key] = Math.round(y.endingBalances[key] ?? 0);
    }
    return row;
  });

  const incomeData = strategy.years.slice(0, 25).map((y) => {
    const bySource: Record<string, number> = {};
    for (const w of y.withdrawals) {
      if (w.account === "shortfall") continue;
      bySource[w.account] = (bySource[w.account] ?? 0) + Math.round(w.amount);
    }
    for (const s of y.incomeStreams) {
      bySource[s.source] = (bySource[s.source] ?? 0) + Math.round(s.amount);
    }
    return { age: y.age, ...bySource };
  });

  const taxData = strategy.years.slice(0, 25).map((y, i) => ({
    age: y.age,
    optimizedTax: Math.round(y.federalTax + y.penalties),
    naiveTax: compareNaive
      ? Math.round(
          (compareNaive.years[i]?.federalTax ?? 0) +
            (compareNaive.years[i]?.penalties ?? 0),
        )
      : 0,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Account balances over time"
        subtitle="Ending balances each year"
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={balanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d5e2db" />
            <XAxis dataKey="age" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatCurrency(v, true)}
              width={56}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              contentStyle={{ borderRadius: 12, borderColor: "#d5e2db" }}
            />
            <Legend />
            {balanceKeys.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={ACCOUNT_COLORS[key]}
                fill={ACCOUNT_COLORS[key]}
                fillOpacity={0.55}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Income sources by year"
        subtitle="Where spending is funded"
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={incomeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d5e2db" />
            <XAxis dataKey="age" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatCurrency(v, true)}
              width={56}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              contentStyle={{ borderRadius: 12, borderColor: "#d5e2db" }}
            />
            {incomeKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={ACCOUNT_COLORS[key]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {compareNaive ? (
        <ChartCard
          title="Tax & penalty burden"
          subtitle="Naive vs optimized (first 25 years)"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={taxData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5e2db" />
              <XAxis dataKey="age" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatCurrency(v, true)}
                width={56}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                contentStyle={{ borderRadius: 12, borderColor: "#d5e2db" }}
              />
              <Legend />
              <Bar dataKey="naiveTax" name="Naive" fill="#b42318" radius={4} />
              <Bar
                dataKey="optimizedTax"
                name="Optimized"
                fill="#0f8a66"
                radius={4}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-line/80 bg-white/80 p-5 shadow-[0_16px_40px_rgba(12,31,26,0.05)] ${className ?? ""}`}
    >
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mb-4 text-xs text-ink-soft">{subtitle}</p>
      {children}
    </div>
  );
}
