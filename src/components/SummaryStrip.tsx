import { fmtM, fmtPct, fmtX } from '@/lib/positions';

interface Props {
  totalCost: number;
  totalEstimated: number;
  totalSec: number;
  totalGrossGain: number;
  totalGrossReturnPct: number;
  avgGrossMultiple: number;
  totalNetValue: number;
  gainers: number;
  total: number;
}

export default function SummaryStrip({ totalCost, totalEstimated, totalSec, totalGrossGain, totalGrossReturnPct, avgGrossMultiple, totalNetValue, gainers, total }: Props) {
  const stats = [
    { label: 'Estimated Value', val: fmtM(totalEstimated), sub: 'Using latest valuation signal', cls: '' },
    { label: 'Total Cost Basis', val: fmtM(totalCost), sub: 'Capital deployed', cls: '' },
    { label: 'Gross Gain', val: fmtM(totalGrossGain), sub: fmtPct(totalGrossReturnPct) + ' gross return', cls: 'c-pos' },
    { label: 'Gross Multiple', val: fmtX(avgGrossMultiple), sub: `${gainers}/${total} positions up`, cls: 'c-acc' },
    { label: 'Net Value After Fees', val: fmtM(totalNetValue), sub: `Secondary basis ${fmtM(totalSec)}`, cls: '' },
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
