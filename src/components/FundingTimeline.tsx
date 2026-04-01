import { FundingRound } from "@/types/financial";

interface FundingTimelineProps {
  rounds: FundingRound[];
}

export function FundingTimeline({ rounds }: FundingTimelineProps) {
  const sorted = [...rounds].sort(
    (a, b) =>
      new Date(b.announcedDate).getTime() - new Date(a.announcedDate).getTime()
  );

  return (
    <div className="flex flex-col">
      {sorted.map((round, i) => (
        <div
          key={round.id}
          className={`grid grid-cols-[auto_1fr_auto] gap-6 py-5 items-start ${
            i < sorted.length - 1 ? "border-b border-[#1f1f1f]" : ""
          }`}
        >
          {/* Series label */}
          <div className="w-24">
            <span className="text-[10px] text-[#404040] tracking-[0.12em] uppercase">
              {round.series}
            </span>
          </div>

          {/* Investors */}
          <div className="flex flex-col gap-1">
            <span className="text-sm text-white">
              {round.leadInvestors.join(", ")}
            </span>
            <div className="flex flex-wrap gap-3 mt-1">
              {round.sources.map((source, j) => (
                <a
                  key={j}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#404040] hover:text-[#737373] tracking-[0.05em] transition-colors underline underline-offset-2 decoration-[#2a2a2a]"
                >
                  {source.name}
                </a>
              ))}
            </div>
          </div>

          {/* Amount + Valuation */}
          <div className="text-right flex flex-col gap-1">
            <span className="text-sm font-semibold text-white">
              {round.amountDisplay}
            </span>
            <span className="text-[10px] text-[#737373] tracking-[0.05em]">
              {round.valuationDisplay} valuation
            </span>
            <span className="text-[10px] text-[#404040]">
              {new Date(round.announcedDate).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
