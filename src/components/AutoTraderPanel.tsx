"use client";

import { useState, useEffect, useCallback } from "react";
import type { AutoTraderSettings, Decision } from "@/lib/autotrader";
import type { AutoTraderRun } from "@/types";

interface RunSummary {
  markets_scanned: number;
  trades_opened: number;
  trades_closed: number;
  cash_deployed: number;
  decisions: Decision[];
}

interface HistoryData {
  runs: AutoTraderRun[];
  totals: { total_runs: number; total_opened: number; total_closed: number; total_deployed: number };
  perf: { total: number; wins: number; total_pnl: number };
}

export default function AutoTraderPanel({ onTradesChanged }: { onTradesChanged: () => void }) {
  const [settings, setSettings] = useState<AutoTraderSettings | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [lastRun, setLastRun] = useState<RunSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState<Partial<AutoTraderSettings>>({});

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/autotrader/settings");
    const data = await res.json();
    setSettings(data.settings);
    setDraft(data.settings);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/autotrader/history?limit=15");
    const data = await res.json();
    setHistory(data);
  }, []);

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, [loadSettings, loadHistory]);

  async function runNow() {
    setRunning(true);
    setError("");
    setLastRun(null);
    try {
      const res = await fetch("/api/autotrader/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Run failed");
      setLastRun(data);
      loadHistory();
      onTradesChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/autotrader/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      setSettings(data.settings);
      setShowSettings(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled() {
    if (!settings) return;
    const res = await fetch("/api/autotrader/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: settings.enabled ? 0 : 1 }),
    });
    const data = await res.json();
    setSettings(data.settings);
    setDraft(data.settings);
  }

  if (!settings) return <div className="text-slate-500 text-sm">Loading...</div>;

  const winRate = (history?.perf?.total ?? 0) > 0
    ? history!.perf.wins / history!.perf.total
    : null;

  return (
    <div className="space-y-5">

      {/* ── Header controls ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-white font-semibold">Auto-Trader</h2>
            <button
              onClick={toggleEnabled}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                settings.enabled ? "bg-emerald-600" : "bg-slate-600"
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                settings.enabled ? "translate-x-5" : "translate-x-1"
              }`} />
            </button>
            <span className={`text-xs font-medium ${settings.enabled ? "text-emerald-400" : "text-slate-500"}`}>
              {settings.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            Scans markets, picks opportunities, sizes positions with Kelly criterion.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
          >
            {showSettings ? "Hide Settings" : "Settings"}
          </button>
          <button
            onClick={runNow}
            disabled={running}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors min-w-[80px]"
          >
            {running ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running
              </span>
            ) : "Run Now"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* ── Settings panel ── */}
      {showSettings && (
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-medium text-white mb-3">Algorithm Settings</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strategy */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Strategy</label>
              <select
                value={draft.strategy}
                onChange={(e) => setDraft({ ...draft, strategy: e.target.value as AutoTraderSettings["strategy"] })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="fade_extremes">Fade Extremes — bet against overconfident markets</option>
                <option value="volume_spike">Volume Spike — follow momentum on news</option>
                <option value="both">Both — use whichever has higher Kelly</option>
              </select>
            </div>

            {/* Min edge */}
            <NumberField
              label="Min Edge Score (0–100)"
              value={draft.min_edge_score ?? 55}
              min={0} max={100} step={5}
              onChange={(v) => setDraft({ ...draft, min_edge_score: v })}
            />

            {/* Max positions */}
            <NumberField
              label="Max Open Auto-Positions"
              value={draft.max_open_positions ?? 8}
              min={1} max={50}
              onChange={(v) => setDraft({ ...draft, max_open_positions: v })}
            />

            {/* Kelly fraction */}
            <SliderField
              label={`Kelly Fraction: ${((draft.kelly_fraction ?? 0.25) * 100).toFixed(0)}%`}
              value={draft.kelly_fraction ?? 0.25}
              min={0.05} max={1} step={0.05}
              onChange={(v) => setDraft({ ...draft, kelly_fraction: v })}
              hint="0.25 = quarter-Kelly (recommended)"
            />

            {/* Max position % */}
            <SliderField
              label={`Max Position Size: ${((draft.max_position_pct ?? 0.05) * 100).toFixed(0)}% of bankroll`}
              value={draft.max_position_pct ?? 0.05}
              min={0.01} max={0.25} step={0.01}
              onChange={(v) => setDraft({ ...draft, max_position_pct: v })}
            />

            {/* Take profit */}
            <SliderField
              label={`Take Profit: +${((draft.take_profit_pct ?? 0.40) * 100).toFixed(0)}%`}
              value={draft.take_profit_pct ?? 0.40}
              min={0.05} max={0.90} step={0.05}
              onChange={(v) => setDraft({ ...draft, take_profit_pct: v })}
            />

            {/* Stop loss */}
            <SliderField
              label={`Stop Loss: −${((draft.stop_loss_pct ?? 0.35) * 100).toFixed(0)}%`}
              value={draft.stop_loss_pct ?? 0.35}
              min={0.05} max={0.90} step={0.05}
              onChange={(v) => setDraft({ ...draft, stop_loss_pct: v })}
            />

            {/* Fade thresholds */}
            <NumberField
              label="Fade High Threshold (e.g. 0.80)"
              value={draft.fade_threshold_high ?? 0.80}
              min={0.51} max={0.99} step={0.01}
              onChange={(v) => setDraft({ ...draft, fade_threshold_high: v })}
            />
            <NumberField
              label="Fade Low Threshold (e.g. 0.20)"
              value={draft.fade_threshold_low ?? 0.20}
              min={0.01} max={0.49} step={0.01}
              onChange={(v) => setDraft({ ...draft, fade_threshold_low: v })}
            />

            {/* Days to resolution */}
            <NumberField
              label="Min Days to Resolution"
              value={draft.min_days_to_resolution ?? 1}
              min={0} max={30} step={0.5}
              onChange={(v) => setDraft({ ...draft, min_days_to_resolution: v })}
            />
            <NumberField
              label="Max Days to Resolution"
              value={draft.max_days_to_resolution ?? 30}
              min={1} max={365}
              onChange={(v) => setDraft({ ...draft, max_days_to_resolution: v })}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            <button
              onClick={() => { setDraft(settings); setShowSettings(false); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Performance summary ── */}
      {history && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Runs" value={history.totals.total_runs} />
          <StatCard label="Auto Trades Opened" value={history.totals.total_opened} />
          <StatCard label="Auto Trades Closed" value={history.totals.total_closed} />
          <StatCard
            label="Auto Win Rate"
            value={winRate !== null ? `${(winRate * 100).toFixed(0)}%` : "—"}
            color={winRate !== null ? (winRate >= 0.51 ? "text-emerald-400" : "text-red-400") : "text-slate-400"}
            sub={history.perf.total > 0 ? `${history.perf.total} closed trades` : undefined}
          />
          <StatCard
            label="Total P&L (auto)"
            value={history.perf.total_pnl != null
              ? `${history.perf.total_pnl >= 0 ? "+" : ""}$${Math.abs(history.perf.total_pnl).toFixed(2)}`
              : "—"}
            color={history.perf.total_pnl >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <StatCard label="Cash Deployed (all runs)" value={`$${history.totals.total_deployed?.toFixed(2) ?? "0.00"}`} />
        </div>
      )}

      {/* ── Last run result ── */}
      {lastRun && (
        <div className="bg-slate-900 border border-violet-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Last Run Result</h3>
            <div className="flex gap-3 text-xs text-slate-400">
              <span>Scanned <span className="text-white">{lastRun.markets_scanned}</span></span>
              <span>Opened <span className="text-emerald-400 font-semibold">{lastRun.trades_opened}</span></span>
              <span>Closed <span className="text-blue-400 font-semibold">{lastRun.trades_closed}</span></span>
              {lastRun.cash_deployed > 0 && (
                <span>Deployed <span className="text-white">${lastRun.cash_deployed.toFixed(2)}</span></span>
              )}
            </div>
          </div>
          <DecisionLog decisions={lastRun.decisions} />
        </div>
      )}

      {/* ── Run history ── */}
      {history && history.runs.length > 0 && (
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-3">Run History</h3>
          <div className="space-y-2">
            {history.runs.map((run) => {
              const decisions: Decision[] = JSON.parse(run.decisions ?? "[]");
              const opens = decisions.filter((d) => d.action === "open");
              const closes = decisions.filter((d) => d.action === "close");
              return (
                <details key={run.id} className="group">
                  <summary className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors list-none">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">{new Date(run.ran_at).toLocaleString()}</span>
                      <span className="text-emerald-400">+{run.trades_opened} opened</span>
                      {run.trades_closed > 0 && <span className="text-blue-400">{run.trades_closed} closed</span>}
                      {run.cash_deployed > 0 && <span className="text-slate-300">${run.cash_deployed.toFixed(2)} deployed</span>}
                    </div>
                    <span className="text-slate-500 text-xs group-open:rotate-90 transition-transform">›</span>
                  </summary>
                  <div className="mt-2 pl-3">
                    <DecisionLog decisions={[...opens, ...closes]} compact />
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DecisionLog({ decisions, compact }: { decisions: Decision[]; compact?: boolean }) {
  const opens = decisions.filter((d) => d.action === "open");
  const closes = decisions.filter((d) => d.action === "close");
  const skips = decisions.filter((d) => d.action === "skip");

  const rows = [
    ...opens.map((d) => ({ ...d, _type: "open" })),
    ...closes.map((d) => ({ ...d, _type: "close" })),
    ...(compact ? [] : skips.slice(0, 5).map((d) => ({ ...d, _type: "skip" }))),
  ];

  if (rows.length === 0) {
    return <p className="text-slate-500 text-xs">No decisions recorded.</p>;
  }

  return (
    <div className="space-y-1.5">
      {rows.map((d, i) => (
        <div key={i} className={`flex items-start gap-2.5 text-xs rounded px-2 py-1.5 ${
          d._type === "open" ? "bg-emerald-900/15" :
          d._type === "close" ? "bg-blue-900/15" :
          "bg-slate-800/30"
        }`}>
          <span className={`shrink-0 font-bold uppercase text-[10px] pt-0.5 w-10 ${
            d._type === "open" ? "text-emerald-400" :
            d._type === "close" ? "text-blue-400" :
            "text-slate-500"
          }`}>
            {d.action}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-slate-300 truncate leading-snug">{d.question || "—"}</p>
            <p className="text-slate-500 mt-0.5">{d.reason}</p>
          </div>
          {d.action === "open" && d.outcome && (
            <div className="shrink-0 text-right">
              <span className={`font-bold ${d.outcome === "YES" ? "text-emerald-400" : "text-red-400"}`}>
                {d.outcome}
              </span>
              {d.cost != null && <p className="text-slate-400">${d.cost.toFixed(2)}</p>}
            </div>
          )}
          {d.action === "close" && d.pnl != null && (
            <span className={`shrink-0 font-mono font-semibold ${d.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(2)}
            </span>
          )}
        </div>
      ))}
      {!compact && skips.length > 5 && (
        <p className="text-slate-600 text-xs pl-2">…and {skips.length - 5} more skipped</p>
      )}
    </div>
  );
}

function StatCard({ label, value, color = "text-white", sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`font-mono font-semibold text-base ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function NumberField({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-violet-500"
      />
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange, hint }: {
  label: string; value: number; min: number; max: number; step: number; hint?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-violet-500"
      />
      {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}
