/**
 * useTutoring Hook
 * React hook for tutoring operations
 */

import { useState, useEffect } from 'react';
import * as tutoringService from '../services/tutoringService';
import { TutoringData, TutoringType, TutoringStatus } from '../services/tutoringService';

interface UseTutoringProps {
  type?: TutoringType;
  status?: TutoringStatus;
}

interface UseTutoringReturn {
  tutoringList: TutoringData[];
  loading: boolean;
  error: string | null;
  createTutoring: (data: Omit<TutoringData, 'id'>) => Promise<string>;
  updateTutoring: (id: string, data: Partial<TutoringData>) => Promise<void>;
  scheduleTutoring: (id: string, date: string, time: string, tutorId: string, tutorName: string) => Promise<void>;
  completeTutoring: (id: string, note?: string) => Promise<void>;
  cancelTutoring: (id: string, reason?: string) => Promise<void>;
  deleteTutoring: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTutoring = (props?: UseTutoringProps): UseTutoringReturn => {
  const [tutoringList, setTutoringList] = useState<TutoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTutoring = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tutoringService.getTutoringList({
        type: props?.type,
        status: props?.status,
      });
      setTutoringList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutoring();
  }, [props?.type, props?.status]);

  const createTutoring = async (data: Omit<TutoringData, 'id'>): Promise<string> => {
    const id = await tutoringService.createTutoring(data);
    await fetchTutoring();
    return id;
  };

  const updateTutoring = async (id: string, data: Partial<TutoringData>): Promise<void> => {
    await tutoringService.updateTutoring(id, data);
    await fetchTutoring();
  };

  const scheduleTutoring = async (
    id: string,
    date: string,
    time: string,
    tutorId: string,
    tutorName: string
  ): Promise<void> => {
    await tutoringService.scheduleTutoring(id, date, time, tutorId, tutorName);
    await fetchTutoring();
  };

  const completeTutoring = async (id: string, note?: string): Promise<void> => {
    await tutoringService.completeTutoring(id, note);
    await fetchTutoring();
  };

  const cancelTutoring = async (id: string, reason?: string): Promise<void> => {
    await tutoringService.cancelTutoring(id, reason);
    await fetchTutoring();
  };

  const deleteTutoring = async (id: string): Promise<void> => {
    await tutoringService.deleteTutoring(id);
    await fetchTutoring();
  };

  return {
    tutoringList,
    loading,
    error,
    createTutoring,
    updateTutoring,
    scheduleTutoring,
    completeTutoring,
    cancelTutoring,
    deleteTutoring,
    refresh: fetchTutoring,
  };
};
