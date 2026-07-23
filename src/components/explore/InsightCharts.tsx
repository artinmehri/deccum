"use client";

import type { CountryCode, StrategyResult } from "@/lib/engine";
import { formatCurrency } from "@/lib/format";
import {
  ACCOUNT_COLORS,
  chartAccountKeys,
  chartIncomeKeys,
} from "@/lib/labels";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function InsightCharts({
  strategy,
  compareNaive,
  country = "US",
}: {
  strategy: StrategyResult;
  compareNaive?: StrategyResult;
  country?: CountryCode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const seriesKeys = [
    ...chartAccountKeys(country),
    ...chartIncomeKeys(country),
  ];

  const wealth = strategy.years.map((y) => ({
    age: y.age,
    money: Math.round(y.endingNetWorth),
    label:
      y.endingNetWorth < 1
        ? "Money has run out"
        : `About ${formatCurrency(y.endingNetWorth)} left at age ${y.age}`,
  }));

  const sources = strategy.years.slice(0, 24).map((y) => {
    const row: Record<string, number | string> = { age: y.age };
    for (const w of y.withdrawals) {
      if (w.account === "shortfall") continue;
      row[w.account] =
        (Number(row[w.account] ?? 0) + Math.round(w.amount)) as number;
    }
    for (const s of y.incomeStreams) {
      row[s.source] =
        (Number(row[s.source] ?? 0) + Math.round(s.amount)) as number;
    }
    return row;
  });

  const taxes = strategy.years.slice(0, 24).map((y, i) => ({
    age: y.age,
    recommended: Math.round(y.federalTax + y.stateTax + y.penalties),
    commonGuess: compareNaive
      ? Math.round(
          (compareNaive.years[i]?.federalTax ?? 0) +
            (compareNaive.years[i]?.stateTax ?? 0) +
            (compareNaive.years[i]?.penalties ?? 0),
        )
      : 0,
  }));

  return (
    <div className="space-y-5">
      <ChartCard
        question="How does my money change over time?"
        help="Each point is what’s left at the end of that age."
        note={active}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={wealth}
            onMouseMove={(state) => {
              const s = state as {
                activePayload?: { payload?: { label?: string } }[];
              };
              setActive(s.activePayload?.[0]?.payload?.label ?? null);
            }}
            onMouseLeave={() => setActive(null)}
          >
            <defs>
              <linearGradient id="wealthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d7a5f" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0d7a5f" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2ebe6" />
            <XAxis dataKey="age" tick={{ fontSize: 13 }} />
            <YAxis
              tick={{ fontSize: 13 }}
              width={64}
              tickFormatter={(v) => formatCurrency(v, true)}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              labelFormatter={(age) => `Age ${age}`}
              contentStyle={{
                borderRadius: 16,
                borderColor: "#e2ebe6",
                fontSize: 15,
              }}
            />
            <Area
              type="monotone"
              dataKey="money"
              name="Money left"
              stroke="#0d7a5f"
              fill="url(#wealthFill)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        question="Which account am I spending from?"
        help="Taller colors mean more money coming from that source."
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sources}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2ebe6" />
            <XAxis dataKey="age" tick={{ fontSize: 13 }} />
            <YAxis
              tick={{ fontSize: 13 }}
              width={64}
              tickFormatter={(v) => formatCurrency(v, true)}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              labelFormatter={(age) => `Age ${age}`}
              contentStyle={{
                borderRadius: 16,
                borderColor: "#e2ebe6",
                fontSize: 15,
              }}
            />
            {seriesKeys.map((key) => (
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
          question="When do taxes and penalties spike?"
          help="Red is the common guess (raid retirement accounts first). Green is Deccum’s recommended order."
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={taxes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2ebe6" />
              <XAxis dataKey="age" tick={{ fontSize: 13 }} />
              <YAxis
                tick={{ fontSize: 13 }}
                width={64}
                tickFormatter={(v) => formatCurrency(v, true)}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                labelFormatter={(age) => `Age ${age}`}
                contentStyle={{
                  borderRadius: 16,
                  borderColor: "#e2ebe6",
                  fontSize: 15,
                }}
              />
              <Bar
                dataKey="commonGuess"
                name="Common guess"
                fill="#b42318"
                radius={6}
              />
              <Bar
                dataKey="recommended"
                name="Recommended"
                fill="#0d7a5f"
                radius={6}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}
    </div>
  );
}

function ChartCard({
  question,
  help,
  note,
  children,
}: {
  question: string;
  help: string;
  note?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-5 sm:p-7">
      <h3 className="font-display text-2xl font-semibold">{question}</h3>
      <p className="mt-2 text-base text-ink-soft">{help}</p>
      {note ? (
        <p className="mt-3 rounded-xl bg-accent-soft/70 px-3 py-2 text-sm font-medium text-accent-deep">
          {note}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}
