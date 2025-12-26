/**
 * useDepartmentBonusConfig Hook
 * React hook for Department KPI Bonus Configuration CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DepartmentBonusConfig, DepartmentCode, DEPARTMENT_LABELS, KpiBonusLevel } from '../../types';

// Default bonus levels template
export const DEFAULT_BONUS_LEVELS: KpiBonusLevel[] = [
    { level: 1, minPercent: 120, maxPercent: 999, label: 'Trên 120%', bonusMultiplier: 1, bonusAmount: 5000000, note: 'Xuất sắc' },
    { level: 2, minPercent: 100, maxPercent: 120, label: '100% - 120%', bonusMultiplier: 2, bonusAmount: 3000000, note: 'Hoàn thành tốt' },
    { level: 3, minPercent: 85, maxPercent: 100, label: '85% - 100%', bonusMultiplier: 3, bonusAmount: 1500000, note: 'Đạt yêu cầu' },
    { level: 4, minPercent: 70, maxPercent: 85, label: '70% - 85%', bonusMultiplier: 4, bonusAmount: 500000, note: 'Cần cải thiện' },
    { level: 5, minPercent: 60, maxPercent: 70, label: '60% - 70%', bonusMultiplier: 5, bonusAmount: 0, note: 'Cảnh báo' },
    { level: 6, minPercent: 0, maxPercent: 60, label: 'Dưới 60%', bonusMultiplier: 6, bonusAmount: 0, note: 'Không đạt' }
];

interface UseDepartmentBonusConfigOptions {
    departmentCode?: DepartmentCode;
}

export const useDepartmentBonusConfig = (options?: UseDepartmentBonusConfigOptions) => {
    const [configs, setConfigs] = useState<DepartmentBonusConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfigs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all configs and filter client-side to avoid composite index requirement
            const snapshot = await getDocs(collection(db, 'departmentBonusConfigs'));
            let data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as DepartmentBonusConfig[];

            // Apply filter client-side
            if (options?.departmentCode) {
                data = data.filter(c => c.departmentCode === options.departmentCode);
            }

            // Sort by createdAt descending
            data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

            setConfigs(data);
        } catch (err: any) {
            console.error('Error fetching bonus configs:', err);
            setError(err.message || 'Không thể tải cấu hình thưởng');
        } finally {
            setLoading(false);
        }
    }, [options?.departmentCode]);


    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    const createConfig = async (data: Omit<DepartmentBonusConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newDoc = doc(collection(db, 'departmentBonusConfigs'));
            const configData = {
                ...data,
                departmentName: DEPARTMENT_LABELS[data.departmentCode],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await setDoc(newDoc, configData);
            await fetchConfigs();
            return newDoc.id;
        } catch (err: any) {
            console.error('Error creating config:', err);
            throw new Error(err.message || 'Không thể tạo cấu hình');
        }
    };

    const updateConfig = async (id: string, data: Partial<DepartmentBonusConfig>) => {
        try {
            const docRef = doc(db, 'departmentBonusConfigs', id);
            const updateData: any = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            // Update department name if code changed
            if (data.departmentCode) {
                updateData.departmentName = DEPARTMENT_LABELS[data.departmentCode];
            }

            await setDoc(docRef, updateData, { merge: true });
            await fetchConfigs();
        } catch (err: any) {
            console.error('Error updating config:', err);
            throw new Error(err.message || 'Không thể cập nhật cấu hình');
        }
    };

    const deleteConfig = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'departmentBonusConfigs', id));
            await fetchConfigs();
        } catch (err: any) {
            console.error('Error deleting config:', err);
            throw new Error(err.message || 'Không thể xóa cấu hình');
        }
    };

    // Get active config for a department
    const getActiveConfig = useCallback((departmentCode: DepartmentCode): DepartmentBonusConfig | null => {
        return configs.find(c => c.departmentCode === departmentCode && c.status === 'active') || null;
    }, [configs]);

    // Calculate bonus based on KPI result
    const calculateBonus = useCallback((departmentCode: DepartmentCode, kpiResult: number): { level: KpiBonusLevel; amount: number } | null => {
        const config = getActiveConfig(departmentCode);
        if (!config) return null;

        // Find matching level
        const level = config.levels.find(l => kpiResult >= l.minPercent && kpiResult < l.maxPercent);
        if (!level) {
            // Check for highest level (above 120%)
            const highestLevel = config.levels.find(l => l.level === 1);
            if (highestLevel && kpiResult >= highestLevel.minPercent) {
                return { level: highestLevel, amount: highestLevel.bonusAmount };
            }
            // Check for lowest level
            const lowestLevel = config.levels.find(l => l.level === 6);
            if (lowestLevel && kpiResult < lowestLevel.maxPercent) {
                return { level: lowestLevel, amount: lowestLevel.bonusAmount };
            }
            return null;
        }

        return { level, amount: level.bonusAmount };
    }, [getActiveConfig]);

    // Get configs grouped by department
    const getConfigsByDepartment = useCallback(() => {
        const grouped: Record<DepartmentCode, DepartmentBonusConfig | null> = {
            sales: null,
            training: null,
            marketing: null,
            accounting: null,
            hr: null
        };

        // Get active config for each department
        Object.keys(grouped).forEach(key => {
            const code = key as DepartmentCode;
            grouped[code] = getActiveConfig(code);
        });

        return grouped;
    }, [getActiveConfig]);

    return {
        configs,
        loading,
        error,
        refetch: fetchConfigs,
        createConfig,
        updateConfig,
        deleteConfig,
        getActiveConfig,
        calculateBonus,
        getConfigsByDepartment,
        DEFAULT_BONUS_LEVELS
    };
};
