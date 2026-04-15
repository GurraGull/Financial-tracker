import { NextResponse } from "next/server";
import { runAutoTrader, learnAndAdapt } from "@/lib/autotrader";
import { getDb } from "@/lib/db";

export async function POST() {
  try {
    const runResult = await runAutoTrader();
    const db = getDb();
    const insight = learnAndAdapt(db);
    return NextResponse.json({ run: runResult, learning: insight });
  } catch (err) {
    console.error("Run-and-learn error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
