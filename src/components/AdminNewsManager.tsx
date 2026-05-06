'use client';

import { useEffect, useMemo, useState } from 'react';
import { Company } from '@/lib/companies';
import { deleteNewsItem, fetchNewsItems, NewsItemRecord, saveNewsItem } from '@/lib/news-db';

interface Props {
  companies: Company[];
  onToast: (msg: string, ok?: boolean) => void;
}

type DraftNews = {
  id: string;
  companyId: string;
  title: string;
  link: string;
  source: string;
  summary: string;
  tag: string;
  publishedAt: string;
  isPublished: boolean;
};

const TAGS = ['general', 'funding', 'valuation', 'secondary', 'arr', 'ipo'];

function makeDraft(): DraftNews {
  return {
    id: '',
    companyId: '',
    title: '',
    link: '',
    source: '',
    summary: '',
    tag: 'general',
    publishedAt: new Date().toISOString().slice(0, 16),
    isPublished: true,
  };
}

export default function AdminNewsManager({ companies, onToast }: Props) {
  const [items, setItems] = useState<NewsItemRecord[]>([]);
  const [draft, setDraft] = useState<DraftNews>(makeDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { items: rows, error } = await fetchNewsItems({ limit: 100 });
      if (cancelled) return;
      setItems(rows);
      setLoading(false);
      if (error) onToast(error, false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [onToast]);

  const companyById = useMemo(
    () => Object.fromEntries(companies.map((company) => [company.id, company])),
    [companies]
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const company = companyById[item.companyId];
      return (
        item.title.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        (company?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [companyById, items, search]);

  const editItem = (item: NewsItemRecord) => {
    setDraft({
      id: item.id,
      companyId: item.companyId,
      title: item.title,
      link: item.link,
      source: item.source,
      summary: item.summary,
      tag: item.tag,
      publishedAt: item.publishedAt.slice(0, 16),
      isPublished: item.isPublished,
    });
  };

  const resetDraft = () => setDraft(makeDraft());

  const handleSave = async () => {
    if (!draft.companyId || !draft.title.trim()) {
      onToast('Company and headline are required', false);
      return;
    }

    setSaving(true);
    const id = draft.id || crypto.randomUUID();
    const err = await saveNewsItem({
      id,
      companyId: draft.companyId,
      title: draft.title.trim(),
      link: draft.link.trim(),
      source: draft.source.trim() || 'Manual',
      summary: draft.summary.trim(),
      tag: draft.tag,
      publishedAt: new Date(draft.publishedAt || new Date().toISOString()).toISOString(),
      isPublished: draft.isPublished,
    });
    if (err) {
      onToast(err, false);
      setSaving(false);
      return;
    }

    const { items: rows } = await fetchNewsItems({ limit: 100 });
    setItems(rows);
    setSaving(false);
    resetDraft();
    onToast('News item saved');
  };

  const handleDelete = async (id: string) => {
    const err = await deleteNewsItem(id);
    if (err) {
      onToast(err, false);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (draft.id === id) resetDraft();
    onToast('News item deleted');
  };

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>News Manager</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>Store and publish company news articles that appear in the portfolio intelligence feed.</div>
        </div>
        <input
          className="pm-fi"
          placeholder="Search news…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          {draft.id ? 'Edit news item' : 'Add news item'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 0.8fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="pm-fg">
            <div className="pm-fl">Company</div>
            <select className="pm-fi" value={draft.companyId} onChange={(e) => setDraft((d) => ({ ...d, companyId: e.target.value }))}>
              <option value="">Select company…</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Headline</div>
            <input className="pm-fi" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Tag</div>
            <select className="pm-fi" value={draft.tag} onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value }))}>
              {TAGS.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Source</div>
            <input className="pm-fi" value={draft.source} onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))} />
          </div>
          <div className="pm-fg" style={{ gridColumn: '1 / 4' }}>
            <div className="pm-fl">Link</div>
            <input className="pm-fi" value={draft.link} onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Published At</div>
            <input className="pm-fi" type="datetime-local" value={draft.publishedAt} onChange={(e) => setDraft((d) => ({ ...d, publishedAt: e.target.value }))} />
          </div>
          <div className="pm-fg" style={{ gridColumn: '1 / -2' }}>
            <div className="pm-fl">Summary</div>
            <input className="pm-fi" value={draft.summary} onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))} />
          </div>
          <div className="pm-fg" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 19 }}>
            <input id="publish-news-item" type="checkbox" checked={draft.isPublished} onChange={(e) => setDraft((d) => ({ ...d, isPublished: e.target.checked }))} />
            <label htmlFor="publish-news-item" style={{ fontSize: 11, color: 'var(--txt2)' }}>Published</label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="pm-btn pri" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : draft.id ? 'Save News' : 'Add News'}</button>
          <button className="pm-btn" onClick={resetDraft}>Clear</button>
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.7fr 0.7fr 0.6fr', gap: 8, padding: '9px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--div)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--txt3)' }}>
          <span>Headline</span>
          <span>Company</span>
          <span>Tag</span>
          <span>Date</span>
          <span style={{ textAlign: 'right' }}>Status</span>
        </div>

        {loading && (
          <div style={{ padding: 16, fontSize: 12, color: 'var(--txt3)' }}>Loading news…</div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div style={{ padding: 16, fontSize: 12, color: 'var(--txt3)' }}>No news items yet.</div>
        )}

        {!loading && filteredItems.map((item, index) => {
          const company = companyById[item.companyId];
          return (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 0.8fr 0.7fr 0.7fr 0.6fr',
                gap: 8,
                padding: '12px 16px',
                borderBottom: index === filteredItems.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{item.title}</div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>{item.source}{item.link ? ` · ${item.link}` : ''}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt2)' }}>{company?.name ?? item.companyId}</div>
              <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{item.tag}</div>
              <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <span style={{ fontSize: 10, color: item.isPublished ? 'var(--green)' : 'var(--txt3)' }}>{item.isPublished ? 'Live' : 'Draft'}</span>
                <button className="pm-btn" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => editItem(item)}>Edit</button>
                <button className="pm-btn danger" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
