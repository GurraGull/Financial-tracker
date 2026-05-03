import { fmtM, fmtPct, fmtX } from '@/lib/positions';

interface Props {
  totalCost: number;
  totalCurr: number;
  totalSec: number;
  totalPL: number;
  totalPLpct: number;
  avgMultiple: number;
  gainers: number;
  total: number;
}

export default function SummaryStrip({ totalCost, totalCurr, totalSec, totalPL, totalPLpct, avgMultiple, gainers, total }: Props) {
  const hasSecondary = totalSec > 0 && totalSec !== totalCurr;
  const stats = [
    { label: 'Total Portfolio Value', val: fmtM(totalCurr), sub: 'Marked to current round', cls: '' },
    { label: 'Total Cost Basis', val: fmtM(totalCost), sub: 'Capital deployed', cls: '' },
    { label: 'Unrealized Gain', val: fmtM(totalPL), sub: fmtPct(totalPLpct) + ' return', cls: totalPL >= 0 ? 'c-pos' : 'c-neg' },
    { label: 'Portfolio Multiple', val: fmtX(avgMultiple), sub: `${gainers}/${total} positions up`, cls: 'c-acc' },
    ...(hasSecondary ? [{ label: 'Secondary Value', val: fmtM(totalSec), sub: 'Blended Forge · Hiive · Notice', cls: '' }] : []),
  ];
  return (
    <div className="pm-strip pm-fu">
      {stats.map((s) => (
        <div key={s.label} className="pm-ss">
          <div className="pm-ss-label">{s.label}</div>
          <div className={`pm-ss-val ${s.cls}`}>{s.val}</div>
          <div className="pm-ss-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
