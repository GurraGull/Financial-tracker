import { Metric } from "@/types/financial";
import { SourceBadge } from "./SourceBadge";

interface MetricCardProps {
  metric: Metric;
  large?: boolean;
}

export function MetricCard({ metric, large = false }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#1f1f1f] pt-6">
      <span className="text-[10px] text-[#404040] tracking-[0.15em] uppercase">
        {metric.label}
      </span>
      <div className="flex flex-col gap-1">
        <span
          className={
            large
              ? "text-5xl md:text-6xl font-semibold text-white tracking-tight leading-none"
              : "text-3xl md:text-4xl font-semibold text-white tracking-tight leading-none"
          }
        >
          {metric.displayValue}
        </span>
        {metric.sublabel && (
          <span className="text-xs text-[#737373] tracking-[0.05em]">
            {metric.sublabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <SourceBadge sources={metric.sources} confidence={metric.confidence} />
        <span className="text-[10px] text-[#404040] tracking-[0.05em]">
          {new Date(metric.asOf).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
