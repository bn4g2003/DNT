import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SalaryScale } from '../../types';

export const useSalaryScale = () => {
  const [salaryScales, setSalaryScales] = useState<SalaryScale[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all salary scales
  const fetchSalaryScales = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'salaryScales'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data: SalaryScale[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as SalaryScale);
      });
      setSalaryScales(data);
    } catch (error) {
      console.error('Error fetching salary scales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryScales();
  }, []);

  // Create salary scale
  const createSalaryScale = async (scaleData: Omit<SalaryScale, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'salaryScales'), {
        ...scaleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await fetchSalaryScales();
      return docRef.id;
    } catch (error) {
      console.error('Error creating salary scale:', error);
      throw error;
    }
  };

  // Update salary scale
  const updateSalaryScale = async (id: string, scaleData: Partial<SalaryScale>) => {
    try {
      const docRef = doc(db, 'salaryScales', id);
      await updateDoc(docRef, {
        ...scaleData,
        updatedAt: new Date().toISOString(),
      });
      await fetchSalaryScales();
    } catch (error) {
      console.error('Error updating salary scale:', error);
      throw error;
    }
  };

  // Delete salary scale
  const deleteSalaryScale = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'salaryScales', id));
      await fetchSalaryScales();
    } catch (error) {
      console.error('Error deleting salary scale:', error);
      throw error;
    }
  };

  return {
    salaryScales,
    loading,
    createSalaryScale,
    updateSalaryScale,
    deleteSalaryScale,
    refetch: fetchSalaryScales,
  };
};
