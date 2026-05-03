import { getSupabase } from './supabase';
import { StoredPosition } from './positions';

interface DbRow {
  id: string;
  company_id: string;
  shares: number;
  entry_share_price: number;
  entry_valuation_m: number;
  current_valuation_m: number;
  secondary_valuation_m: number;
  entry_date: string;
  notes: string;
}

const toRow = (p: StoredPosition, userId: string): DbRow & { user_id: string } => ({
  id: p.id,
  user_id: userId,
  company_id: p.companyId,
  shares: p.shares,
  entry_share_price: p.entrySharePrice,
  entry_valuation_m: p.entryValuationM,
  current_valuation_m: p.currentValuationM,
  secondary_valuation_m: p.secondaryValuationM,
  entry_date: p.entryDate,
  notes: p.notes,
});

const fromRow = (r: DbRow): StoredPosition => ({
  id: r.id,
  companyId: r.company_id,
  shares: Number(r.shares),
  entrySharePrice: Number(r.entry_share_price),
  entryValuationM: Number(r.entry_valuation_m),
  currentValuationM: Number(r.current_valuation_m),
  secondaryValuationM: Number(r.secondary_valuation_m),
  entryDate: r.entry_date,
  notes: r.notes,
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
