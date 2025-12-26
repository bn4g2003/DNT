/**
 * useSalaryReport Hook
 */

import { useState, useEffect } from 'react';
import * as salaryReportService from '../services/salaryReportService';
import { SalarySummary } from '../services/salaryReportService';

interface UseSalaryReportReturn {
  summaries: SalarySummary[];
  loading: boolean;
  error: string | null;
  totalSalary: number;
  refresh: (month?: number, year?: number) => Promise<void>;
}

export const useSalaryReport = (month?: number, year?: number): UseSalaryReportReturn => {
  const [summaries, setSummaries] = useState<SalarySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (m?: number, y?: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await salaryReportService.getSalaryReport(m, y);
      setSummaries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(month, year);
  }, [month, year]);

  const totalSalary = summaries.reduce((sum, s) => sum + s.estimatedSalary, 0);

  return {
    summaries,
    loading,
    error,
    totalSalary,
    refresh: fetchReport,
  };
};
