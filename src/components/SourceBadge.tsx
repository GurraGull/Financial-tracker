import { MetricSource, Confidence } from "@/types/financial";

interface SourceBadgeProps {
  sources: MetricSource[];
  confidence: Confidence;
}

const confidenceConfig: Record<
  Confidence,
  { label: string; color: string }
> = {
  confirmed: {
    label: "Confirmed",
    color: "text-[#737373] border-[#2a2a2a]",
  },
  estimated: {
    label: "Est.",
    color: "text-[#737373] border-[#2a2a2a]",
  },
  rumored: {
    label: "Rumored",
    color: "text-[#737373] border-[#2a2a2a]",
  },
};

export function SourceBadge({ sources, confidence }: SourceBadgeProps) {
  const config = confidenceConfig[confidence];

  if (sources.length === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] tracking-[0.08em] uppercase border px-1.5 py-0.5 ${config.color}`}
      >
        {config.label}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 text-[10px] tracking-[0.08em] uppercase border px-1.5 py-0.5 ${config.color}`}
      >
        {config.label}
      </span>
      {sources.map((source, i) => (
        <a
          key={i}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#404040] hover:text-[#737373] tracking-[0.05em] transition-colors underline underline-offset-2 decoration-[#2a2a2a]"
        >
          {source.name}
        </a>
      ))}
    </div>
  );
}
