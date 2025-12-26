/**
 * useCurriculums Hook - Realtime listener
 */

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as curriculumService from '../services/curriculumService';
import { Curriculum, CurriculumStatus } from '../services/curriculumService';

interface UseCurriculumsProps {
  status?: CurriculumStatus;
}

interface UseCurriculumsReturn {
  curriculums: Curriculum[];
  loading: boolean;
  error: string | null;
  createCurriculum: (data: Omit<Curriculum, 'id'>) => Promise<string>;
  updateCurriculum: (id: string, data: Partial<Curriculum>) => Promise<void>;
  deleteCurriculum: (id: string) => Promise<void>;
}

export const useCurriculums = (props?: UseCurriculumsProps): UseCurriculumsReturn => {
  const [allCurriculums, setAllCurriculums] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(collection(db, 'curriculums'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Curriculum));
        
        if (props?.status) {
          data = data.filter(c => c.status === props.status);
        }
        
        setAllCurriculums(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to curriculums:', err);
        setError(err.message || 'Không thể tải danh sách giáo trình');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [props?.status]);

  const createCurriculum = async (data: Omit<Curriculum, 'id'>): Promise<string> => {
    return await curriculumService.createCurriculum(data);
  };

  const updateCurriculum = async (id: string, data: Partial<Curriculum>): Promise<void> => {
    await curriculumService.updateCurriculum(id, data);
  };

  const deleteCurriculum = async (id: string): Promise<void> => {
    await curriculumService.deleteCurriculum(id);
  };

  return {
    curriculums: allCurriculums,
    loading,
    error,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
  };
};
