import { NextResponse } from "next/server";
import { runAutoTrader } from "@/lib/autotrader";

export async function POST() {
  try {
    const result = await runAutoTrader();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Autotrader run error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
