import { getSupabase } from './supabase';
import { StoredPosition } from './positions';

interface DbRow {
  id: string;
  company_id: string;
  holding_type?: string;
  investment_amount?: number;
  currency?: string;
  purchase_date?: string;
  entry_valuation_m: number;
  shares?: number | null;
  cost_per_share?: number | null;
  vehicle_name?: string;
  carry_pct?: number;
  annual_management_fee_pct?: number;
  one_time_admin_fee?: number;
  notes: string;
  include_in_community_stats?: boolean;
  entry_share_price?: number;
  entry_date?: string;
}

const toRow = (p: StoredPosition, userId: string): DbRow & { user_id: string } => ({
  id: p.id,
  user_id: userId,
  company_id: p.companyId,
  holding_type: p.holdingType,
  investment_amount: p.investmentAmount,
  currency: p.currency,
  purchase_date: p.purchaseDate,
  entry_valuation_m: p.entryValuationM,
  shares: p.shares,
  cost_per_share: p.costPerShare,
  vehicle_name: p.vehicleName,
  carry_pct: p.carryPct,
  annual_management_fee_pct: p.annualManagementFeePct,
  one_time_admin_fee: p.oneTimeAdminFee,
  notes: p.notes,
  include_in_community_stats: p.includeInCommunityStats,
});

const fromRow = (r: DbRow): StoredPosition => ({
  id: r.id,
  companyId: r.company_id,
  holdingType: (r.holding_type as StoredPosition['holdingType']) ?? 'direct',
  investmentAmount: Number(r.investment_amount ?? ((r.shares ?? 0) * (r.entry_share_price ?? 0))),
  currency: r.currency ?? 'USD',
  purchaseDate: r.purchase_date ?? r.entry_date ?? '',
  entryValuationM: Number(r.entry_valuation_m),
  shares: r.shares == null ? null : Number(r.shares),
  costPerShare: r.cost_per_share == null ? (r.entry_share_price == null ? null : Number(r.entry_share_price)) : Number(r.cost_per_share),
  vehicleName: r.vehicle_name ?? '',
  carryPct: Number(r.carry_pct ?? 0),
  annualManagementFeePct: Number(r.annual_management_fee_pct ?? 0),
  oneTimeAdminFee: Number(r.one_time_admin_fee ?? 0),
  notes: r.notes,
  includeInCommunityStats: !!r.include_in_community_stats,
});

export async function dbLoad(userId: string): Promise<StoredPosition[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from('positions').select('*').eq('user_id', userId).order('created_at');
  if (error) { console.error('dbLoad', error); return []; }
  return (data as DbRow[]).map(fromRow);
}

export async function dbUpsert(userId: string, pos: StoredPosition): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('positions').upsert(toRow(pos, userId));
  if (error) console.error('dbUpsert', error);
}

export async function dbDelete(userId: string, id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('positions').delete().eq('id', id).eq('user_id', userId);
  if (error) console.error('dbDelete', error);
}
