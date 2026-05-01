interface Segment { color: string; pct: number; }

export default function Donut({ segments, size = 110 }: { segments: Segment[]; size?: number }) {
  const r = 38, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dasharray 0.8s ease' }} />
        );
        offset += dash;
        return el;
      })}
      <text x="50" y="47" textAnchor="middle" fill="rgba(255,255,255,0.92)" fontSize="12" fontWeight="700" fontFamily="var(--mono)">{segments.length}</text>
      <text x="50" y="59" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="var(--font)">positions</text>
    </svg>
  );
}
