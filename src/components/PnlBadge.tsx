"use client";

interface PnlBadgeProps {
  value: number;
  prefix?: string;
}

export default function PnlBadge({ value, prefix = "$" }: PnlBadgeProps) {
  const isPos = value >= 0;
  const color = isPos ? "text-emerald-400" : "text-red-400";
  const sign = isPos ? "+" : "";
  return (
    <span className={`font-mono font-semibold ${color}`}>
      {sign}{prefix}{Math.abs(value).toFixed(2)}
    </span>
  );
}
