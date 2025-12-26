/**
 * useMarketingKpis Hook
 * React hook for Marketing KPIs CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { MarketingKpi } from '../types/marketingTypes';
import * as kpiService from '../services/marketingKpiService';

interface UseMarketingKpisOptions {
    staffId?: string;
    month?: string;
}

export const useMarketingKpis = (options?: UseMarketingKpisOptions) => {
    const [kpis, setKpis] = useState<MarketingKpi[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchKpis = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await kpiService.getKpis(options);
            setKpis(data);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách KPI');
        } finally {
            setLoading(false);
        }
    }, [options?.staffId, options?.month]);

    useEffect(() => {
        fetchKpis();
    }, [fetchKpis]);

    const createKpi = async (data: Omit<MarketingKpi, 'id' | 'createdAt' | 'updatedAt'>) => {
        const id = await kpiService.createKpi(data);
        await fetchKpis();
        return id;
    };

    const updateKpi = async (id: string, data: Partial<MarketingKpi>) => {
        await kpiService.updateKpi(id, data);
        await fetchKpis();
    };

    const deleteKpi = async (id: string) => {
        await kpiService.deleteKpi(id);
        await fetchKpis();
    };

    const calculateKpiPercent = (kpi: MarketingKpi) => {
        return kpiService.calculateKpiPercent(kpi);
    };

    const getStaffKpiCompletion = (staffId: string) => {
        return kpiService.calculateStaffKpiCompletion(kpis, staffId);
    };

    const getOverallPerformance = (taskPercent: number, kpiPercent: number) => {
        return kpiService.calculateOverallPerformance(taskPercent, kpiPercent);
    };

    return {
        kpis,
        loading,
        error,
        refetch: fetchKpis,
        createKpi,
        updateKpi,
        deleteKpi,
        calculateKpiPercent,
        getStaffKpiCompletion,
        getOverallPerformance,
    };
};
