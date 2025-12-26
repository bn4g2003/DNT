/**
 * useHolidays Hook - Realtime listener
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Holiday } from '../../types';

interface UseHolidaysReturn {
  holidays: Holiday[];
  loading: boolean;
  error: string | null;
  createHoliday: (data: Omit<Holiday, 'id'>) => Promise<string>;
  updateHoliday: (id: string, data: Partial<Holiday>) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
}

export const useHolidays = (): UseHolidaysReturn => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Query without orderBy to avoid index issues, sort client-side
    const unsubscribe = onSnapshot(
      collection(db, 'holidays'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Holiday[];
        // Sort by startDate client-side
        data.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
        setHolidays(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading holidays:', err);
        setError(err.message || 'Không thể tải danh sách ngày nghỉ');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const createHoliday = async (data: Omit<Holiday, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'holidays'), data);
    return docRef.id;
  };

  const updateHoliday = async (id: string, data: Partial<Holiday>): Promise<void> => {
    await updateDoc(doc(db, 'holidays', id), data);
  };

  const deleteHoliday = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'holidays', id));
  };

  return {
    holidays,
    loading,
    error,
    createHoliday,
    updateHoliday,
    deleteHoliday,
  };
};
