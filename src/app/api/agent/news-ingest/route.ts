import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

type AgentNewsPayload = {
  company_id: string;
  title: string;
  link?: string;
  source?: string;
  summary?: string;
  tag?: string;
  published_at?: string;
  external_id?: string;
  submitted_by?: string;
};

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function normalizeTag(tag?: string) {
  return (tag?.trim().toLowerCase() || 'general').slice(0, 50);
}

function normalizePublishedAt(value?: string) {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function normalizeItem(item: AgentNewsPayload, publishedAt: string) {
  return {
    company_id: item.company_id.trim(),
    title: item.title.trim(),
    link: item.link?.trim() || '',
    source: item.source?.trim() || 'ChatGPT Agent',
    summary: item.summary?.trim() || '',
    tag: normalizeTag(item.tag),
    published_at: publishedAt,
    is_published: false,
    submission_source: 'agent',
    submitted_by: item.submitted_by?.trim() || 'chatgpt-agent',
    external_id: item.external_id?.trim() || '',
    updated_at: new Date().toISOString(),
  };
}

async function handleItems(items: AgentNewsPayload[]) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Missing Supabase server credentials' }, { status: 500 });
  }

  const validItems = items.filter((item) => item.company_id?.trim() && item.title?.trim());
  if (validItems.length === 0) {
    return badRequest('At least one valid news item is required');
  }

  const companyIds = [...new Set(validItems.map((item) => item.company_id.trim()))];
  const { data: companies, error: companiesError } = await admin
    .from('companies')
    .select('id')
    .in('id', companyIds);

  if (companiesError) {
    return NextResponse.json({ error: companiesError.message }, { status: 500 });
  }

  const existingCompanies = new Set((companies ?? []).map((row) => row.id as string));
  const missingCompanies = companyIds.filter((id) => !existingCompanies.has(id));
  if (missingCompanies.length > 0) {
    return badRequest(`Unknown company_id values: ${missingCompanies.join(', ')}`);
  }

  const normalizedDates = validItems.map((item) => normalizePublishedAt(item.published_at));
  const invalidDateIndexes = normalizedDates
    .map((value, index) => (value ? null : index + 1))
    .filter((value): value is number => value !== null);
  if (invalidDateIndexes.length > 0) {
    return badRequest(`Invalid published_at on item positions: ${invalidDateIndexes.join(', ')}`);
  }

  const rows = validItems.map((item, index) => normalizeItem(item, normalizedDates[index] as string));
  const accepted: typeof rows = [];

  for (const row of rows) {
    if (row.external_id) {
      const { data: duplicateByExternal } = await admin
        .from('news_items')
        .select('id')
        .eq('external_id', row.external_id)
        .limit(1);
      if (duplicateByExternal?.length) continue;
    }

    if (row.link) {
      const { data: duplicateByLink } = await admin
        .from('news_items')
        .select('id')
        .eq('company_id', row.company_id)
        .eq('link', row.link)
        .limit(1);
      if (duplicateByLink?.length) continue;
    }

    accepted.push(row);
  }

  if (accepted.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: rows.length, status: 'deduped' });
  }

  const { error } = await admin.from('news_items').insert(accepted);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted: accepted.length,
    skipped: rows.length - accepted.length,
    status: 'ok',
  });
}

export async function POST(request: NextRequest) {
  const expectedToken = process.env.AGENT_NEWS_INGEST_TOKEN;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!expectedToken || bearerToken !== expectedToken) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  if (Array.isArray(body)) {
    return handleItems(body as AgentNewsPayload[]);
  }

  if (body && typeof body === 'object' && Array.isArray((body as { items?: unknown[] }).items)) {
    return handleItems((body as { items: AgentNewsPayload[] }).items);
  }

  return handleItems([body as AgentNewsPayload]);
}
