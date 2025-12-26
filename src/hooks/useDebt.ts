/**
 * useDebt Hook
 */

import { useState, useEffect } from 'react';
import * as debtService from '../services/debtService';
import { DebtRecord } from '../services/debtService';

interface UseDebtReturn {
  debts: DebtRecord[];
  totalDebt: number;
  loading: boolean;
  error: string | null;
  markAsPaid: (id: string, amount?: number) => Promise<void>;
  updateNote: (id: string, note: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useDebt = (): UseDebtReturn => {
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await debtService.getDebtRecords();
      setDebts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const totalDebt = debts.reduce((sum, d) => sum + d.debtAmount, 0);

  const markAsPaid = async (id: string, amount?: number): Promise<void> => {
    await debtService.markAsPaid(id, amount);
    await fetchDebts();
  };

  const updateNote = async (id: string, note: string): Promise<void> => {
    await debtService.updateDebtNote(id, note);
    await fetchDebts();
  };

  return {
    debts,
    totalDebt,
    loading,
    error,
    markAsPaid,
    updateNote,
    refresh: fetchDebts,
  };
};
