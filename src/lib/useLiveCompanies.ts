'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabase } from './supabase';
import { Company, COMPANIES } from './companies';
import { fetchCompanies } from './companies-db';

const POLL_MS = 60_000;

export interface LiveCompanies {
  companies: Company[];
  live: boolean;            // realtime socket connected
  lastUpdate: Date | null;  // last time data arrived (realtime or poll)
}

/**
 * Live company data: initial fetch + Supabase Realtime subscription on
 * `companies` and `secondary_prices`, with a polling fallback so data
 * stays fresh even when the socket is down.
 */
export function useLiveCompanies(): LiveCompanies {
  const [companies, setCompanies] = useState<Company[]>(COMPANIES);
  const [live, setLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const { companies: rows } = await fetchCompanies();
      if (rows.length) {
        setCompanies(rows);
        setLastUpdate(new Date());
      }
    } finally {
      refreshing.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();

    const sb = getSupabase();
    if (!sb) return;

    const channel = sb
      .channel('live-companies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'secondary_prices' }, refresh)
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));

    const poll = setInterval(refresh, POLL_MS);

    return () => {
      clearInterval(poll);
      sb.removeChannel(channel);
    };
  }, [refresh]);

  return { companies, live, lastUpdate };
}
