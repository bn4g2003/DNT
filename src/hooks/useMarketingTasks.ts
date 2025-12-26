/**
 * useMarketingTasks Hook
 * React hook for Marketing Tasks CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { MarketingTask } from '../types/marketingTypes';
import * as taskService from '../services/marketingTaskService';

interface UseMarketingTasksOptions {
    status?: string;
    assignedTo?: string;
    campaignId?: string;
}

export const useMarketingTasks = (options?: UseMarketingTasksOptions) => {
    const [tasks, setTasks] = useState<MarketingTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await taskService.getTasks(options);
            setTasks(data);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách task');
        } finally {
            setLoading(false);
        }
    }, [options?.status, options?.assignedTo, options?.campaignId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const createTask = async (data: Omit<MarketingTask, 'id' | 'createdAt' | 'updatedAt'>) => {
        const id = await taskService.createTask(data);
        await fetchTasks();
        return id;
    };

    const updateTask = async (id: string, data: Partial<MarketingTask>) => {
        await taskService.updateTask(id, data);
        await fetchTasks();
    };

    const deleteTask = async (id: string) => {
        await taskService.deleteTask(id);
        await fetchTasks();
    };

    const getStaffCompletion = (staffId: string) => {
        return taskService.calculateStaffTaskCompletion(tasks, staffId);
    };

    return {
        tasks,
        loading,
        error,
        refetch: fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        getStaffCompletion,
    };
};
