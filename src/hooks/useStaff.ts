/**
 * useStaff Hook - Realtime listener
 * React hook for staff operations
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Staff } from '../../types';
import * as staffService from '../services/staffService';

interface UseStaffProps {
  department?: string;
  role?: string;
  status?: string;
}

interface UseStaffReturn {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  createStaff: (data: Omit<Staff, 'id'>) => Promise<string>;
  updateStaff: (id: string, data: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useStaff = (props?: UseStaffProps): UseStaffReturn => {
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Realtime listener
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      collection(db, 'staff'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Staff[];
        setAllStaff(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Không thể tải danh sách nhân viên');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Client-side filtering
  const staff = useMemo(() => {
    let filtered = allStaff;
    
    if (props?.department) {
      filtered = filtered.filter(s => s.department === props.department);
    }
    if (props?.role) {
      filtered = filtered.filter(s => s.role === props.role);
    }
    if (props?.status) {
      filtered = filtered.filter(s => s.status === props.status);
    }
    
    return filtered;
  }, [allStaff, props?.department, props?.role, props?.status]);

  const createStaff = async (data: Omit<Staff, 'id'>): Promise<string> => {
    return await staffService.createStaff(data);
  };

  const updateStaff = async (id: string, data: Partial<Staff>): Promise<void> => {
    await staffService.updateStaff(id, data);
  };

  const deleteStaff = async (id: string): Promise<void> => {
    await staffService.deleteStaff(id);
  };

  const refresh = async (): Promise<void> => {
    // No-op for realtime - data auto-updates
  };

  return {
    staff,
    loading,
    error,
    createStaff,
    updateStaff,
    deleteStaff,
    refresh,
  };
};
