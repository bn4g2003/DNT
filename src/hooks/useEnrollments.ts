/**
 * useEnrollments Hook
 * React hook for enrollment operations
 */

import { useState, useEffect } from 'react';
import { EnrollmentRecord } from '../../types';
import * as enrollmentService from '../services/enrollmentService';

interface UseEnrollmentsProps {
  type?: string;
  month?: number;
  year?: number;
}

interface UseEnrollmentsReturn {
  enrollments: EnrollmentRecord[];
  loading: boolean;
  error: string | null;
  createEnrollment: (data: Omit<EnrollmentRecord, 'id'>) => Promise<string>;
  updateEnrollment: (id: string, data: Partial<EnrollmentRecord>) => Promise<void>;
  deleteEnrollment: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useEnrollments = (props?: UseEnrollmentsProps): UseEnrollmentsReturn => {
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await enrollmentService.getEnrollments({
        type: props?.type,
        month: props?.month,
        year: props?.year,
      });
      setEnrollments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [props?.type, props?.month, props?.year]);

  const createEnrollment = async (data: Omit<EnrollmentRecord, 'id'>): Promise<string> => {
    const id = await enrollmentService.createEnrollment(data);
    await fetchEnrollments();
    return id;
  };

  const updateEnrollment = async (id: string, data: Partial<EnrollmentRecord>): Promise<void> => {
    await enrollmentService.updateEnrollment(id, data);
    await fetchEnrollments();
  };

  const deleteEnrollment = async (id: string): Promise<void> => {
    await enrollmentService.deleteEnrollment(id);
    await fetchEnrollments();
  };

  return {
    enrollments,
    loading,
    error,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    refresh: fetchEnrollments,
  };
};
