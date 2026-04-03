"use client";

interface EdgeBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export default function EdgeBadge({ score, size = "md" }: EdgeBadgeProps) {
  const color =
    score >= 70
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : score >= 45
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-slate-700/50 text-slate-400 border-slate-600/30";

  const label =
    score >= 70 ? "HIGH EDGE" : score >= 45 ? "WATCH" : "LOW";

  const px = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1 rounded border font-mono font-semibold tracking-wide ${px} ${color}`}>
      <span>{score}</span>
      <span className="opacity-70">{label}</span>
    </span>
  );
}
