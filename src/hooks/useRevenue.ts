/**
 * useRevenue Hook
 */

import { useState, useEffect } from 'react';
import * as revenueService from '../services/revenueService';
import { RevenueSummary } from '../services/revenueService';

interface UseRevenueReturn {
  summary: RevenueSummary | null;
  loading: boolean;
  error: string | null;
  refresh: (year?: number) => Promise<void>;
}

export const useRevenue = (year?: number): UseRevenueReturn => {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async (y?: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await revenueService.getRevenueSummary(y);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(year);
  }, [year]);

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary,
  };
};
