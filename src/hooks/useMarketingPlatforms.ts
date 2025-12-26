/**
 * useMarketingPlatforms Hook
 * React hook for Marketing Platforms and Stats
 */

import { useState, useEffect, useCallback } from 'react';
import { MarketingPlatform, PlatformMonthlyStats } from '../types/marketingTypes';
import * as platformService from '../services/marketingPlatformService';

export const useMarketingPlatforms = () => {
    const [platforms, setPlatforms] = useState<MarketingPlatform[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlatforms = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await platformService.getPlatforms();
            setPlatforms(data);

            // Initialize default platforms if empty
            if (data.length === 0) {
                await platformService.initializeDefaultPlatforms();
                const refreshed = await platformService.getPlatforms();
                setPlatforms(refreshed);
            }
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách nền tảng');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlatforms();
    }, [fetchPlatforms]);

    const createPlatform = async (data: Omit<MarketingPlatform, 'id' | 'createdAt' | 'updatedAt'>) => {
        const id = await platformService.createPlatform(data);
        await fetchPlatforms();
        return id;
    };

    const updatePlatform = async (id: string, data: Partial<MarketingPlatform>) => {
        await platformService.updatePlatform(id, data);
        await fetchPlatforms();
    };

    const deletePlatform = async (id: string) => {
        await platformService.deletePlatform(id);
        await fetchPlatforms();
    };

    return {
        platforms,
        loading,
        error,
        refetch: fetchPlatforms,
        createPlatform,
        updatePlatform,
        deletePlatform,
    };
};

// Hook for monthly stats
export const usePlatformStats = (month: string) => {
    const [stats, setStats] = useState<PlatformMonthlyStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await platformService.getStatsByMonth(month);
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => {
        if (month) {
            fetchStats();
        }
    }, [fetchStats, month]);

    const updateStats = async (id: string, data: Partial<PlatformMonthlyStats>) => {
        await platformService.updateStats(id, data);
        await fetchStats();
    };

    const createStats = async (data: Omit<PlatformMonthlyStats, 'id' | 'createdAt' | 'updatedAt'>) => {
        const id = await platformService.createStats(data);
        await fetchStats();
        return id;
    };

    const getOrCreateStats = async (platformId: string, platformName: string) => {
        const result = await platformService.getOrCreateStats(platformId, platformName, month);
        await fetchStats();
        return result;
    };

    return {
        stats,
        loading,
        error,
        refetch: fetchStats,
        updateStats,
        createStats,
        getOrCreateStats,
    };
};
