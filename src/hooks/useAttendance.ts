/**
 * useAttendance Hook
 * React hook for attendance operations
 */

import { useState, useEffect } from 'react';
import { AttendanceRecord, StudentAttendance, AttendanceStatus } from '../../types';
import * as attendanceService from '../services/attendanceService';

interface UseAttendanceProps {
  classId?: string;
  date?: string;
}

interface UseAttendanceReturn {
  attendanceRecords: AttendanceRecord[];
  currentAttendance: AttendanceRecord | null;
  studentAttendance: StudentAttendance[];
  loading: boolean;
  error: string | null;
  checkExisting: (classId: string, date: string) => Promise<AttendanceRecord | null>;
  loadStudentAttendance: (attendanceId: string) => Promise<void>;
  saveAttendance: (
    attendanceData: Omit<AttendanceRecord, 'id'> & { sessionId?: string },
    students: Array<{
      studentId: string;
      studentName: string;
      studentCode: string;
      status: AttendanceStatus;
      note?: string;
      homeworkCompletion?: number;
      testName?: string;
      score?: number;
      bonusPoints?: number;
    }>
  ) => Promise<string>;
  deleteAttendance: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAttendance = (props?: UseAttendanceProps): UseAttendanceReturn => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord | null>(null);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.getAttendanceRecords({
        classId: props?.classId,
        date: props?.date,
      });
      setAttendanceRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [props?.classId, props?.date]);

  const checkExisting = async (classId: string, date: string): Promise<AttendanceRecord | null> => {
    try {
      const existing = await attendanceService.checkExistingAttendance(classId, date);
      setCurrentAttendance(existing);
      return existing;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  };

  const loadStudentAttendance = async (attendanceId: string): Promise<void> => {
    try {
      setLoading(true);
      const data = await attendanceService.getStudentAttendance(attendanceId);
      setStudentAttendance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const saveAttendance = async (
    attendanceData: Omit<AttendanceRecord, 'id'> & { sessionId?: string },
    students: Array<{
      studentId: string;
      studentName: string;
      studentCode: string;
      status: AttendanceStatus;
      note?: string;
      homeworkCompletion?: number;
      testName?: string;
      score?: number;
      bonusPoints?: number;
    }>
  ): Promise<string> => {
    const id = await attendanceService.saveFullAttendance(attendanceData, students);
    await fetchRecords();
    return id;
  };

  const deleteAttendance = async (id: string): Promise<void> => {
    await attendanceService.deleteAttendanceRecord(id);
    await fetchRecords();
  };

  return {
    attendanceRecords,
    currentAttendance,
    studentAttendance,
    loading,
    error,
    checkExisting,
    loadStudentAttendance,
    saveAttendance,
    deleteAttendance,
    refresh: fetchRecords,
  };
};
