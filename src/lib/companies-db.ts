import { getSupabase } from './supabase';
import { Company, COMPANIES } from './companies';

interface DBRow {
  id: string; name: string; ticker: string; sector: string; color: string;
  current_valuation_m: number; last_round_date: string; stage: string;
  description: string; arr_m: number | null; forge_price: number | null; hiive_price: number | null;
  notice_price: number | null; domain: string; updated_at: string;
}

function rowToCompany(r: DBRow): Company {
  return {
    id: r.id, name: r.name, ticker: r.ticker, sector: r.sector, color: r.color,
    currentValuationM: r.current_valuation_m, lastRoundDate: r.last_round_date,
    stage: r.stage, description: r.description, arrM: r.arr_m,
    forgePrice: r.forge_price, hiivePrice: r.hiive_price, noticePrice: r.notice_price,
    domain: r.domain,
  };
}

function companyToRow(c: Company): Omit<DBRow, 'updated_at'> {
  return {
    id: c.id, name: c.name, ticker: c.ticker, sector: c.sector, color: c.color,
    current_valuation_m: c.currentValuationM, last_round_date: c.lastRoundDate,
    stage: c.stage, description: c.description, arr_m: c.arrM,
    forge_price: c.forgePrice, hiive_price: c.hiivePrice, notice_price: c.noticePrice,
    domain: c.domain,
  };
}

export async function fetchCompanies(): Promise<{ companies: Company[]; updatedAt: string | null }> {
  const sb = getSupabase();
  if (!sb) return { companies: COMPANIES, updatedAt: null };
  try {
    const { data, error } = await sb
      .from('companies')
      .select('*')
      .order('current_valuation_m', { ascending: false });
    if (error || !data?.length) return { companies: COMPANIES, updatedAt: null };
    const companies = (data as DBRow[]).map(rowToCompany);
    const updatedAt = (data as DBRow[]).reduce<string | null>((latest, r) =>
      !latest || r.updated_at > latest ? r.updated_at : latest, null);
    return { companies, updatedAt };
  } catch {
    return { companies: COMPANIES, updatedAt: null };
  }
}

export async function saveCompany(c: Company): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Not connected';
  const { error } = await sb
    .from('companies')
    .upsert({ ...companyToRow(c), updated_at: new Date().toISOString() }, { onConflict: 'id' });
  return error?.message ?? null;
}

export async function addSecondaryPrice(
  companyId: string, source: 'forge' | 'hiive' | 'notice', price: number, notes = ''
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Not connected';
  const { error } = await sb.from('secondary_prices').insert({ company_id: companyId, source, price, notes });
  return error?.message ?? null;
}

export async function fetchSecondaryPrices(): Promise<Record<string, { forge?: number; hiive?: number; notice?: number; lastUpdated?: string }>> {
  const sb = getSupabase();
  if (!sb) return {};
  try {
    const { data } = await sb
      .from('secondary_prices')
      .select('company_id, source, price, recorded_at')
      .order('recorded_at', { ascending: false });
    if (!data) return {};
    const result: Record<string, { forge?: number; hiive?: number; notice?: number; lastUpdated?: string }> = {};
    for (const row of data as { company_id: string; source: string; price: number; recorded_at: string }[]) {
      if (!result[row.company_id]) result[row.company_id] = {};
      const entry = result[row.company_id];
      if (row.source === 'forge' && entry.forge === undefined) entry.forge = row.price;
      if (row.source === 'hiive' && entry.hiive === undefined) entry.hiive = row.price;
      if (row.source === 'notice' && entry.notice === undefined) entry.notice = row.price;
      if (!entry.lastUpdated || row.recorded_at > entry.lastUpdated) entry.lastUpdated = row.recorded_at;
    }
    return result;
  } catch {
    return {};
  }
}
