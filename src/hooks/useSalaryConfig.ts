/**
 * useSalaryConfig Hook
 * React hook for salary configuration
 */

import { useState, useEffect } from 'react';
import * as salaryConfigService from '../services/salaryConfigService';
import { 
  SalaryRule, 
  SalaryRangeConfig, 
  RangeType 
} from '../services/salaryConfigService';

interface UseSalaryConfigReturn {
  salaryRules: SalaryRule[];
  salaryRanges: SalaryRangeConfig[];
  teachingRanges: SalaryRangeConfig[];
  feedbackRanges: SalaryRangeConfig[];
  loading: boolean;
  error: string | null;
  createRule: (data: Omit<SalaryRule, 'id'>) => Promise<string>;
  updateRule: (id: string, data: Partial<SalaryRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  createRange: (data: Omit<SalaryRangeConfig, 'id'>) => Promise<string>;
  updateRange: (id: string, data: Partial<SalaryRangeConfig>) => Promise<void>;
  deleteRange: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useSalaryConfig = (): UseSalaryConfigReturn => {
  const [salaryRules, setSalaryRules] = useState<SalaryRule[]>([]);
  const [salaryRanges, setSalaryRanges] = useState<SalaryRangeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [rules, ranges] = await Promise.all([
        salaryConfigService.getSalaryRules(),
        salaryConfigService.getSalaryRanges(),
      ]);
      
      setSalaryRules(rules);
      setSalaryRanges(ranges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const teachingRanges = salaryRanges.filter(r => r.type === 'Teaching');
  const feedbackRanges = salaryRanges.filter(r => r.type === 'AssistantFeedback');

  const createRule = async (data: Omit<SalaryRule, 'id'>): Promise<string> => {
    const id = await salaryConfigService.createSalaryRule(data);
    await fetchData();
    return id;
  };

  const updateRule = async (id: string, data: Partial<SalaryRule>): Promise<void> => {
    await salaryConfigService.updateSalaryRule(id, data);
    await fetchData();
  };

  const deleteRule = async (id: string): Promise<void> => {
    await salaryConfigService.deleteSalaryRule(id);
    await fetchData();
  };

  const createRange = async (data: Omit<SalaryRangeConfig, 'id'>): Promise<string> => {
    const id = await salaryConfigService.createSalaryRange(data);
    await fetchData();
    return id;
  };

  const updateRange = async (id: string, data: Partial<SalaryRangeConfig>): Promise<void> => {
    await salaryConfigService.updateSalaryRange(id, data);
    await fetchData();
  };

  const deleteRange = async (id: string): Promise<void> => {
    await salaryConfigService.deleteSalaryRange(id);
    await fetchData();
  };

  return {
    salaryRules,
    salaryRanges,
    teachingRanges,
    feedbackRanges,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    createRange,
    updateRange,
    deleteRange,
    refresh: fetchData,
  };
};
