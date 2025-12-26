/**
 * useSessions Hook
 * React hook for class sessions operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ClassSession,
  getSessionsByClass,
  getUpcomingSessions,
  getAllPendingSessions,
  updateSessionStatus,
  getSessionByClassAndDate,
  addMakeupSession,
} from '../services/sessionService';

interface UseSessionsProps {
  classId?: string;
  status?: ClassSession['status'];
  fromDate?: string;
  toDate?: string;
}

interface UseSessionsReturn {
  sessions: ClassSession[];
  upcomingSessions: ClassSession[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSessionForDate: (date: string) => Promise<ClassSession | null>;
  markSessionComplete: (sessionId: string, attendanceId: string) => Promise<void>;
  addMakeup: (date: string, time?: string, note?: string) => Promise<string>;
}

export const useSessions = (props?: UseSessionsProps): UseSessionsReturn => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!props?.classId) {
      setSessions([]);
      setUpcomingSessions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all sessions for the class
      const allSessions = await getSessionsByClass(props.classId, {
        status: props.status,
        fromDate: props.fromDate,
        toDate: props.toDate,
      });
      setSessions(allSessions);

      // Fetch upcoming sessions (get all, no limit for dropdown)
      const upcoming = await getUpcomingSessions(props.classId, 100);
      setUpcomingSessions(upcoming);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải buổi học');
    } finally {
      setLoading(false);
    }
  }, [props?.classId, props?.status, props?.fromDate, props?.toDate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const getSessionForDate = useCallback(async (date: string): Promise<ClassSession | null> => {
    if (!props?.classId) return null;
    return getSessionByClassAndDate(props.classId, date);
  }, [props?.classId]);

  const markSessionComplete = useCallback(async (sessionId: string, attendanceId: string): Promise<void> => {
    await updateSessionStatus(sessionId, 'Đã học', attendanceId);
    await fetchSessions();
  }, [fetchSessions]);

  const addMakeup = useCallback(async (date: string, time?: string, note?: string): Promise<string> => {
    if (!props?.classId) throw new Error('No class selected');
    
    // Get class info from sessions
    const classInfo = sessions[0] || upcomingSessions[0];
    if (!classInfo) throw new Error('No class info available');
    
    const id = await addMakeupSession(
      {
        id: props.classId,
        name: classInfo.className,
        teacherId: classInfo.teacherId,
        teacherName: classInfo.teacherName,
        room: classInfo.room,
      },
      date,
      time,
      note
    );
    
    await fetchSessions();
    return id;
  }, [props?.classId, sessions, upcomingSessions, fetchSessions]);

  return {
    sessions,
    upcomingSessions,
    loading,
    error,
    refresh: fetchSessions,
    getSessionForDate,
    markSessionComplete,
    addMakeup,
  };
};

/**
 * Hook to get all pending sessions across classes
 */
export const useAllPendingSessions = (classIds?: string[]) => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPendingSessions({ classIds });
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải buổi học');
    } finally {
      setLoading(false);
    }
  }, [classIds]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refresh: fetchSessions };
};
