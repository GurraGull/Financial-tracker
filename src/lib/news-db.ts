import { getSupabase } from './supabase';

export interface NewsItemRecord {
  id: string;
  companyId: string;
  title: string;
  link: string;
  source: string;
  summary: string;
  tag: string;
  publishedAt: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NewsRow {
  id: string;
  company_id: string;
  title: string;
  link: string;
  source: string;
  summary: string;
  tag: string;
  published_at: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const fromRow = (row: NewsRow): NewsItemRecord => ({
  id: row.id,
  companyId: row.company_id,
  title: row.title,
  link: row.link,
  source: row.source,
  summary: row.summary,
  tag: row.tag,
  publishedAt: row.published_at,
  isPublished: row.is_published,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRow = (item: Omit<NewsItemRecord, 'createdAt' | 'updatedAt'>): Omit<NewsRow, 'created_at' | 'updated_at'> => ({
  id: item.id,
  company_id: item.companyId,
  title: item.title,
  link: item.link,
  source: item.source,
  summary: item.summary,
  tag: item.tag,
  published_at: item.publishedAt,
  is_published: item.isPublished,
});

export interface FetchNewsOptions {
  companyIds?: string[];
  limit?: number;
  publishedOnly?: boolean;
}

export async function fetchNewsItems(options: FetchNewsOptions = {}): Promise<{ items: NewsItemRecord[]; error: string | null }> {
  const sb = getSupabase();
  if (!sb) return { items: [], error: 'Not connected' };

  try {
    let query = sb
      .from('news_items')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(options.limit ?? 50);

    if (options.companyIds?.length) query = query.in('company_id', options.companyIds);
    if (options.publishedOnly) query = query.eq('is_published', true);

    const { data, error } = await query;
    if (error) return { items: [], error: error.message };
    return { items: ((data ?? []) as NewsRow[]).map(fromRow), error: null };
  } catch {
    return { items: [], error: 'Failed to load news' };
  }
}

export async function saveNewsItem(item: Omit<NewsItemRecord, 'createdAt' | 'updatedAt'>): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Not connected';
  const { error } = await sb
    .from('news_items')
    .upsert({ ...toRow(item), updated_at: new Date().toISOString() });
  return error?.message ?? null;
}

export async function deleteNewsItem(id: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return 'Not connected';
  const { error } = await sb.from('news_items').delete().eq('id', id);
  return error?.message ?? null;
}
