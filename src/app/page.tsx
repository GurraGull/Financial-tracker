import { Nav } from "@/components/Nav";
import { MetricCard } from "@/components/MetricCard";
import { FinancialStatement } from "@/components/FinancialStatement";
import { FundingTimeline } from "@/components/FundingTimeline";
import { anduril } from "@/data/anduril";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Company identity */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] text-[#404040] tracking-[0.2em] uppercase">
              {anduril.sector}
            </span>
            <span className="text-[#1f1f1f]">·</span>
            <span className="text-[10px] text-[#404040] tracking-[0.2em] uppercase">
              Est. {anduril.founded}
            </span>
            <span className="text-[#1f1f1f]">·</span>
            <span className="text-[10px] text-[#404040] tracking-[0.2em] uppercase">
              {anduril.hq}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tight leading-none mb-4">
            {anduril.name}
          </h1>
          <p className="text-sm text-[#737373] max-w-2xl leading-relaxed">
            {anduril.description}
          </p>
        </div>

        {/* Hero metrics — the big numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {anduril.heroMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} large />
          ))}
        </div>
      </section>

      {/* ── DIVIDER ──────────────────────────────────────────────────── */}
      <div className="border-t border-[#1f1f1f]" />

      {/* ── FINANCIAL STATEMENT ──────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <p className="text-[10px] text-[#404040] tracking-[0.15em] uppercase mb-2">
              Financial Statement
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {anduril.financialStatement.period}
            </h2>
          </div>
          <span className="text-[10px] text-[#404040] tracking-[0.1em] uppercase">
            Source-backed
          </span>
        </div>
        <FinancialStatement statement={anduril.financialStatement} />
      </section>

      {/* ── DIVIDER ──────────────────────────────────────────────────── */}
      <div className="border-t border-[#1f1f1f]" />

      {/* ── KEY METRICS ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <p className="text-[10px] text-[#404040] tracking-[0.15em] uppercase mb-10">
          Key Metrics
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {anduril.keyMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      {/* ── DIVIDER ──────────────────────────────────────────────────── */}
      <div className="border-t border-[#1f1f1f]" />

      {/* ── FUNDING TIMELINE ─────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <p className="text-[10px] text-[#404040] tracking-[0.15em] uppercase mb-2">
              Funding History
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {anduril.heroMetrics.find((m) => m.id === "total_raised")
                ?.displayValue ?? ""}{" "}
              Raised
            </h2>
          </div>
        </div>
        <FundingTimeline rounds={anduril.fundingRounds} />
      </section>

      {/* ── DIVIDER ──────────────────────────────────────────────────── */}
      <div className="border-t border-[#1f1f1f]" />

      {/* ── METHODOLOGY ──────────────────────────────────────────────── */}
      <section id="methodology" className="py-20 px-6 max-w-7xl mx-auto">
        <p className="text-[10px] text-[#404040] tracking-[0.15em] uppercase mb-6">
          Methodology
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">Data Sources</h3>
            <p className="text-xs text-[#737373] leading-relaxed">
              All figures are sourced from publicly available information
              including news reports (Bloomberg, WSJ, Reuters, The Information),
              official press releases, U.S. Department of Defense contract
              announcements, and research platforms (Crunchbase, PitchBook).
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">
              Confidence Levels
            </h3>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "Confirmed",
                  desc: "Directly stated in an official press release or government filing.",
                },
                {
                  label: "Estimated",
                  desc: "Reported by a credible outlet or derived from publicly available data.",
                },
                {
                  label: "Rumored",
                  desc: "Circulating in media without primary source confirmation.",
                },
              ].map((item) => (
                <div key={item.label} className="flex gap-3">
                  <span className="text-[10px] text-[#404040] tracking-[0.1em] uppercase w-20 shrink-0 pt-0.5">
                    {item.label}
                  </span>
                  <p className="text-xs text-[#737373] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1f1f1f] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#404040] tracking-[0.15em] uppercase">
              Anduril Financials
            </span>
            <span className="text-[#1f1f1f]">·</span>
            <span className="text-[10px] text-[#404040]">
              Independent. Not affiliated with Anduril Industries, Inc.
            </span>
          </div>
          <span className="text-[10px] text-[#404040] tracking-[0.05em]">
            Last updated:{" "}
            {new Date(anduril.lastUpdated).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </footer>
    </div>
  );
}
