import { FinancialStatement as FinancialStatementType } from "@/types/financial";
import { SourceBadge } from "./SourceBadge";

interface FinancialStatementProps {
  statement: FinancialStatementType;
}

export function FinancialStatement({ statement }: FinancialStatementProps) {
  return (
    <div className="flex flex-col gap-0">
      {statement.items.map((item, i) => (
        <div
          key={i}
          className={`grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 py-6 ${
            i < statement.items.length - 1 ? "border-b border-[#1f1f1f]" : ""
          }`}
        >
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-[#404040] tracking-[0.12em] uppercase">
              {item.label}
            </span>
            {item.note && (
              <p className="text-xs text-[#737373] leading-relaxed max-w-xl">
                {item.note}
              </p>
            )}
            <SourceBadge sources={item.sources} confidence={item.confidence} />
          </div>
          <div className="flex items-start md:justify-end">
            <span className="text-xl font-semibold text-white tabular-nums">
              {item.valueDisplay}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
