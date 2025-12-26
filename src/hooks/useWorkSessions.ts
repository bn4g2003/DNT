/**
 * useWorkSessions Hook
 */

import { useState, useEffect } from 'react';
import * as workSessionService from '../services/workSessionService';
import { WorkSession, WorkStatus } from '../services/workSessionService';

interface UseWorkSessionsProps {
  status?: WorkStatus;
  date?: string;
}

interface UseWorkSessionsReturn {
  sessions: WorkSession[];
  loading: boolean;
  error: string | null;
  createSession: (data: Omit<WorkSession, 'id'>) => Promise<string>;
  updateSession: (id: string, data: Partial<WorkSession>) => Promise<void>;
  confirmSession: (id: string) => Promise<void>;
  confirmAll: (ids: string[]) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useWorkSessions = (props?: UseWorkSessionsProps): UseWorkSessionsReturn => {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workSessionService.getWorkSessions({
        status: props?.status,
        date: props?.date,
      });
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [props?.status, props?.date]);

  const createSession = async (data: Omit<WorkSession, 'id'>): Promise<string> => {
    const id = await workSessionService.createWorkSession(data);
    await fetchSessions();
    return id;
  };

  const updateSession = async (id: string, data: Partial<WorkSession>): Promise<void> => {
    await workSessionService.updateWorkSession(id, data);
    await fetchSessions();
  };

  const confirmSession = async (id: string): Promise<void> => {
    await workSessionService.confirmWorkSession(id);
    await fetchSessions();
  };

  const confirmAll = async (ids: string[]): Promise<void> => {
    await workSessionService.confirmAllWorkSessions(ids);
    await fetchSessions();
  };

  const deleteSession = async (id: string): Promise<void> => {
    await workSessionService.deleteWorkSession(id);
    await fetchSessions();
  };

  const toggleStatus = async (id: string): Promise<void> => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    
    const newStatus: WorkStatus = session.status === 'Đã xác nhận' ? 'Chờ xác nhận' : 'Đã xác nhận';
    await updateSession(id, { status: newStatus });
  };

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    confirmSession,
    confirmAll,
    deleteSession,
    toggleStatus,
    refresh: fetchSessions,
  };
};
