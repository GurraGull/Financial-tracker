"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
  LabelList,
} from "recharts";
import {
  investments,
  totalInvested,
  totalPaperValueLow,
  totalPaperValueHigh,
  totalProjectedValueLow,
  totalProjectedValueHigh,
  totalMultiplierLow,
  totalMultiplierHigh,
  totalProjectedMultiplierLow,
  totalProjectedMultiplierHigh,
} from "@/data/portfolio";

function fmtSEK(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

function fmtSEKShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

const valueComparisonData = investments.map((inv) => ({
  company: inv.company,
  Invested: inv.invested,
  "Current (mid)": Math.round((inv.paperValueLow + inv.paperValueHigh) / 2),
  "Projected (mid)": Math.round(
    (inv.projectedValueLow + inv.projectedValueHigh) / 2
  ),
  color: inv.color,
}));

const multiplierData = investments.map((inv) => ({
  company: inv.company,
  "Current Low": inv.multiplierLow,
  "Current High": inv.multiplierHigh - inv.multiplierLow,
  "Projected Low": inv.projectedMultiplierLow,
  "Projected High": inv.projectedMultiplierHigh - inv.projectedMultiplierLow,
  currentMid: ((inv.multiplierLow + inv.multiplierHigh) / 2).toFixed(1),
  projectedMid: (
    (inv.projectedMultiplierLow + inv.projectedMultiplierHigh) /
    2
  ).toFixed(1),
  color: inv.color,
}));

const allocationData = investments.map((inv) => ({
  name: inv.company,
  value: inv.invested,
  color: inv.color,
}));

const CustomTooltipSEK = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 font-semibold mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {fmtSEK(entry.value)} SEK
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltipMultiplier = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const inv = investments.find((i) => i.company === label);
    if (!inv) return null;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 font-semibold mb-2">{label}</p>
        <p className="text-sm text-blue-400">
          Current: {inv.multiplierLow}× – {inv.multiplierHigh}×
        </p>
        <p className="text-sm text-emerald-400">
          Projected: {inv.projectedMultiplierLow}× – {inv.projectedMultiplierHigh}×
        </p>
      </div>
    );
  }
  return null;
};

const CustomTooltipPie = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) => {
  if (active && payload && payload.length) {
    const pct = ((payload[0].value / totalInvested) * 100).toFixed(1);
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
        <p className="font-semibold" style={{ color: payload[0].payload.color }}>
          {payload[0].name}
        </p>
        <p className="text-slate-300 text-sm">
          {fmtSEK(payload[0].value)} SEK ({pct}%)
        </p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = (props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  name?: string;
  percent?: number;
}) => {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, name = "", percent = 0 } = props;
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {name === "Databricks" ? "DB" : name.slice(0, 3).toUpperCase()}
    </text>
  );
};

export default function PortfolioDashboard() {
  const currentPaperMid = Math.round((totalPaperValueLow + totalPaperValueHigh) / 2);
  const projectedMid = Math.round((totalProjectedValueLow + totalProjectedValueHigh) / 2);
  const currentMultMid = ((totalMultiplierLow + totalMultiplierHigh) / 2).toFixed(1);
  const projMultMid = ((totalProjectedMultiplierLow + totalProjectedMultiplierHigh) / 2).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Private Investment Portfolio
          </h1>
          <p className="text-slate-400 mt-1">
            As of April 2026 · 5 companies · Valuations in SEK
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            label="Total Invested"
            value={`${fmtSEK(totalInvested)} SEK`}
            sub="across 5 companies"
            color="text-slate-300"
            border="border-slate-700"
          />
          <SummaryCard
            label="Current Paper Value"
            value={`~${fmtSEK(currentPaperMid)} SEK`}
            sub={`${fmtSEKShort(totalPaperValueLow)} – ${fmtSEKShort(totalPaperValueHigh)}`}
            color="text-blue-400"
            border="border-blue-900"
          />
          <SummaryCard
            label="Projected Value"
            value={`~${fmtSEK(projectedMid)} SEK`}
            sub={`${fmtSEKShort(totalProjectedValueLow)} – ${fmtSEKShort(totalProjectedValueHigh)}+`}
            color="text-emerald-400"
            border="border-emerald-900"
          />
          <div className="bg-slate-900 border border-amber-900 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Overall Multiplier</p>
            <p className="text-2xl font-bold text-amber-400">{currentMultMid}×</p>
            <p className="text-slate-500 text-xs mt-1">
              Current · Projected {projMultMid}×
            </p>
            <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                style={{ width: `${Math.min(100, (parseFloat(currentMultMid) / parseFloat(projMultMid)) * 100)}%` }}
              />
            </div>
            <p className="text-slate-600 text-xs mt-1">
              {((parseFloat(currentMultMid) / parseFloat(projMultMid)) * 100).toFixed(0)}% of projected
            </p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Allocation Donut */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-slate-200 mb-1">
              Capital Allocation
            </h2>
            <p className="text-slate-500 text-xs mb-4">By invested SEK</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {allocationData.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={entry.color}
                      stroke={entry.color}
                      strokeWidth={0}
                      opacity={0.9}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-2">
              {allocationData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-slate-300 text-xs">{d.name}</span>
                  </div>
                  <span className="text-slate-400 text-xs">
                    {fmtSEK(d.value)} SEK (
                    {((d.value / totalInvested) * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Value Comparison Bar Chart */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-slate-200 mb-1">
              Value Comparison
            </h2>
            <p className="text-slate-500 text-xs mb-4">
              Invested vs Current vs Projected (SEK, mid-range)
            </p>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={valueComparisonData}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                barCategoryGap="20%"
                barGap={3}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="company"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => fmtSEKShort(v)}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<CustomTooltipSEK />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 8 }}
                />
                <Bar dataKey="Invested" fill="#334155" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Current (mid)" radius={[3, 3, 0, 0]}>
                  {valueComparisonData.map((entry, i) => (
                    <Cell key={`cur-${i}`} fill={entry.color} opacity={0.7} />
                  ))}
                </Bar>
                <Bar dataKey="Projected (mid)" radius={[3, 3, 0, 0]}>
                  {valueComparisonData.map((entry, i) => (
                    <Cell key={`proj-${i}`} fill={entry.color} opacity={1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multiplier Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-1">
            Multiplier Ranges
          </h2>
          <p className="text-slate-500 text-xs mb-4">
            Current (blue) and projected (green) return multipliers per company
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={multiplierData}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
              barSize={14}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 25]}
                tickCount={6}
                tickFormatter={(v) => `${v}×`}
              />
              <YAxis
                type="category"
                dataKey="company"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltipMultiplier />} />
              <ReferenceLine x={1} stroke="#475569" strokeDasharray="4 4" />
              {/* Current range stacked bars */}
              <Bar
                dataKey="Current Low"
                stackId="current"
                fill="transparent"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Current High"
                stackId="current"
                fill="#3B82F6"
                opacity={0.8}
                radius={[0, 3, 3, 0]}
              >
                <LabelList
                  dataKey="currentMid"
                  position="right"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
formatter={(v: any) => v != null ? `${v}×` : ""}
                  style={{ fill: "#93c5fd", fontSize: 10 }}
                />
              </Bar>
              {/* Projected range stacked bars */}
              <Bar
                dataKey="Projected Low"
                stackId="projected"
                fill="transparent"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Projected High"
                stackId="projected"
                fill="#10B981"
                opacity={0.8}
                radius={[0, 3, 3, 0]}
              >
                <LabelList
                  dataKey="projectedMid"
                  position="right"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
formatter={(v: any) => v != null ? `${v}×` : ""}
                  style={{ fill: "#6ee7b7", fontSize: 10 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-3 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500 opacity-80" />
              <span className="text-slate-400 text-xs">Current multiplier range</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500 opacity-80" />
              <span className="text-slate-400 text-xs">Projected multiplier range</span>
            </div>
          </div>
        </div>

        {/* Company Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {investments.map((inv) => {
            const currentMid = Math.round(
              (inv.paperValueLow + inv.paperValueHigh) / 2
            );
            const projectedMid = Math.round(
              (inv.projectedValueLow + inv.projectedValueHigh) / 2
            );
            const currentMultMid = (
              (inv.multiplierLow + inv.multiplierHigh) /
              2
            ).toFixed(1);
            const projMultMid = (
              (inv.projectedMultiplierLow + inv.projectedMultiplierHigh) /
              2
            ).toFixed(1);
            const progressPct = Math.min(
              100,
              (inv.invested / inv.paperValueHigh) * 100
            );

            return (
              <div
                key={inv.company}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition-colors"
                style={{ borderTopColor: inv.color, borderTopWidth: 2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: inv.color }}
                  />
                  <h3 className="font-semibold text-slate-200 text-sm">
                    {inv.company}
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invested</span>
                    <span className="text-slate-300 font-mono">
                      {fmtSEK(inv.invested)} SEK
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entry Val.</span>
                    <span className="text-slate-300 font-mono">
                      ${inv.entryValuationB}B
                    </span>
                  </div>

                  <div className="border-t border-slate-800 pt-2">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-500">Now (mid)</span>
                      <span className="font-mono" style={{ color: inv.accentColor }}>
                        {fmtSEK(currentMid)} SEK
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="text-slate-600">Range</span>
                      <span className="font-mono text-slate-500 text-[10px]">
                        {fmtSEKShort(inv.paperValueLow)}–{fmtSEKShort(inv.paperValueHigh)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-lg px-3 py-2 flex justify-between items-center">
                    <span className="text-slate-400">Mult.</span>
                    <span
                      className="font-bold text-sm"
                      style={{ color: inv.color }}
                    >
                      {currentMultMid}×
                    </span>
                  </div>

                  <div className="border-t border-slate-800 pt-2">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-500">Projected</span>
                      <span className="text-emerald-400 font-mono">
                        {fmtSEK(projectedMid)} SEK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 text-[10px]">Target mult.</span>
                      <span className="text-emerald-500 font-bold text-xs">
                        {projMultMid}×
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <p className="text-slate-600 text-[10px] leading-tight">
                      {inv.projectedStage}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-slate-700 text-xs mt-8 text-center">
          Paper values are estimates based on secondary market prices and reported
          valuations. Not financial advice.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
  border,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  border: string;
}) {
  return (
    <div className={`bg-slate-900 border ${border} rounded-xl p-4`}>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-slate-500 text-xs mt-1">{sub}</p>
    </div>
  );
}
