import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { AutoTraderSettings } from "@/lib/autotrader";

export async function GET() {
  const db = getDb();
  const settings = db.prepare("SELECT * FROM autotrader_settings WHERE id = 1").get();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json() as Partial<AutoTraderSettings>;
  const db = getDb();

  const allowed: (keyof AutoTraderSettings)[] = [
    "enabled", "strategy", "min_edge_score", "max_open_positions",
    "kelly_fraction", "max_position_pct", "fade_threshold_high",
    "fade_threshold_low", "regression_factor", "take_profit_pct",
    "stop_loss_pct", "min_days_to_resolution", "max_days_to_resolution",
  ];

  const setClauses = allowed
    .filter((k) => body[k] !== undefined)
    .map((k) => `${k} = @${k}`)
    .join(", ");

  if (!setClauses) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  db.prepare(
    `UPDATE autotrader_settings SET ${setClauses}, updated_at = datetime('now') WHERE id = 1`
  ).run(body);

  const updated = db.prepare("SELECT * FROM autotrader_settings WHERE id = 1").get();
  return NextResponse.json({ settings: updated });
}
