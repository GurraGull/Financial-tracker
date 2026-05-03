'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  type PieLabelRenderProps,
} from 'recharts';
import { DerivedPosition, fmtK, fmtPct } from '@/lib/positions';

interface Props { positions: DerivedPosition[]; }

const RADIAN = Math.PI / 180;

function PieLabel({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, name = '' }: PieLabelRenderProps) {
  const pct = percent as number;
  const ir = innerRadius as number;
  const or = outerRadius as number;
  const angle = midAngle as number;
  if (pct < 0.06) return null;
  const r = ir + (or - ir) * 0.55;
  const x = (cx as number) + r * Math.cos(-angle * RADIAN);
  const y = (cy as number) + r * Math.sin(-angle * RADIAN);
  const n = String(name);
  const label = n.length > 6 ? n.slice(0, 4) : n;
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>{label}</text>;
}

function TooltipBox({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string; pct?: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <div style={{ color: d.payload.color, fontWeight: 700, marginBottom: 2 }}>{d.name}</div>
      <div style={{ color: 'var(--txt2)' }}>{fmtK(d.value)}{d.payload.pct !== undefined ? ` · ${d.payload.pct.toFixed(1)}%` : ''}</div>
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginBottom: 2 }}>{title}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 16 }}>{sub}</div>}
      {children}
    </div>
  );
}

export default function ChartsView({ positions }: Props) {
  if (positions.length === 0) {
    return (
      <div className="pm-empty">
        <div className="pm-empty-icon">◈</div>
        <div className="pm-empty-title">No positions to chart</div>
        <div className="pm-empty-sub">Add holdings to see portfolio charts.</div>
      </div>
    );
  }

  const totalCost = positions.reduce((s, p) => s + p.costBasis, 0);

  const allocData = positions.map((p) => ({
    name: p.name,
    value: p.currentValue,
    color: p.color,
    pct: p.allocation,
  }));

  const perfData = positions.map((p) => ({
    name: p.name.length > 10 ? p.name.slice(0, 8) + '…' : p.name,
    fullName: p.name,
    cost: Math.round(p.costBasis),
    current: Math.round(p.currentValue),
    color: p.color,
    pct: p.unrealizedPct,
  }));

  const withCarry = positions.filter((p) => (p.carryPct ?? 0) > 0 && p.carryFee > 0);
  const withMgmt = positions.filter((p) => (p.managementFeePct ?? 0) > 0 && p.managementFeeAnnual > 0);

  const carryData = withCarry.map((p) => ({
    name: p.name.length > 10 ? p.name.slice(0, 8) + '…' : p.name,
    value: Math.round(p.carryFee),
    color: p.color,
  }));

  const mgmtData = withMgmt.map((p) => ({
    name: p.name.length > 10 ? p.name.slice(0, 8) + '…' : p.name,
    annual: Math.round(p.managementFeeAnnual),
    total: Math.round(p.managementFeeTotal),
    color: p.color,
  }));

  const totalCarry = withCarry.reduce((s, p) => s + p.carryFee, 0);
  const totalMgmtAnnual = withMgmt.reduce((s, p) => s + p.managementFeeAnnual, 0);
  const totalMgmtTotal = withMgmt.reduce((s, p) => s + p.managementFeeTotal, 0);

  return (
    <div className="pm-fu" style={{ display: 'flex', flexDirection: 'column', gap: 16, animationDelay: '0.04s' }}>

      {/* Row 1: Allocation + Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <ChartCard title="Portfolio Allocation" sub="By current value">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={allocData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value" labelLine={false} label={PieLabel}>
                {allocData.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} opacity={0.9} />)}
              </Pie>
              <Tooltip content={<TooltipBox />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
            {allocData.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--txt2)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{d.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Cost Basis vs Current Value" sub="By position">
          <ResponsiveContainer width="100%" height={220 + allocData.length * 5}>
            <BarChart data={perfData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barCategoryGap="25%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--txt3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => fmtK(v)} tick={{ fill: 'var(--txt3)', fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = perfData.find((d) => d.name === label);
                  return (
                    <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{row?.fullName ?? label}</div>
                      {payload.map((e) => (
                        <div key={e.name} style={{ color: e.name === 'current' ? row?.color : 'var(--txt3)' }}>
                          {e.name === 'cost' ? 'Cost Basis' : 'Current Value'}: {fmtK(e.value as number)}
                        </div>
                      ))}
                      <div style={{ color: (row?.pct ?? 0) >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>
                        Return: {fmtPct(row?.pct ?? 0)}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="cost" name="cost" fill="rgba(255,255,255,0.08)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="current" name="current" radius={[3, 3, 0, 0]}>
                {perfData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 10, color: 'var(--txt3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }} /> Cost Basis</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--indigo)' }} /> Current Value</div>
            <div style={{ marginLeft: 'auto' }}>Total deployed: {fmtK(totalCost)}</div>
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Fee charts (only shown when fees are set) */}
      {(carryData.length > 0 || mgmtData.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: carryData.length > 0 && mgmtData.length > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>

          {carryData.length > 0 && (
            <ChartCard title="Carry Fee" sub={`${withCarry[0].carryPct}% carry on unrealized gains · Total: ${fmtK(totalCarry)}`}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={carryData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--txt3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => fmtK(v)} tick={{ fill: 'var(--txt3)', fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
                          <div style={{ fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{label}</div>
                          <div style={{ color: 'var(--red)' }}>Carry Fee: {fmtK(payload[0].value as number)}</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {carryData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.7} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {mgmtData.length > 0 && (
            <ChartCard title="Management Fee" sub={`${withMgmt[0].managementFeePct}% / yr · Annual: ${fmtK(totalMgmtAnnual)} · Total paid: ${fmtK(totalMgmtTotal)}`}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={mgmtData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barCategoryGap="30%" barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--txt3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => fmtK(v)} tick={{ fill: 'var(--txt3)', fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const row = mgmtData.find((d) => d.name === label);
                      return (
                        <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
                          <div style={{ fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{label}</div>
                          <div style={{ color: 'var(--txt2)' }}>Annual: {fmtK(row?.annual ?? 0)}</div>
                          <div style={{ color: 'var(--red)' }}>Total paid: {fmtK(row?.total ?? 0)}</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="annual" name="Annual" fill="rgba(255,255,255,0.06)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="total" name="Total paid" radius={[3, 3, 0, 0]}>
                    {mgmtData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.6} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 10, color: 'var(--txt3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }} /> Annual</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--indigo)', opacity: 0.6 }} /> Total paid</div>
              </div>
            </ChartCard>
          )}

        </div>
      )}

      {carryData.length === 0 && mgmtData.length === 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 12, padding: '16px 20px', fontSize: 11, color: 'var(--txt3)' }}>
          No fund fees added yet. Edit a position and set a Carry % or Management Fee % to see fee charts here.
        </div>
      )}
    </div>
  );
}
