import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Candidate } from '../../types';

export const useCandidate = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all candidates
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'candidates'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data: Candidate[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Candidate);
      });
      setCandidates(data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Create candidate
  const createCandidate = async (candidateData: Omit<Candidate, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'candidates'), {
        ...candidateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await fetchCandidates();
      return docRef.id;
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  };

  // Update candidate
  const updateCandidate = async (id: string, candidateData: Partial<Candidate>) => {
    try {
      const docRef = doc(db, 'candidates', id);
      await updateDoc(docRef, {
        ...candidateData,
        updatedAt: new Date().toISOString(),
      });
      await fetchCandidates();
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  };

  // Delete candidate
  const deleteCandidate = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'candidates', id));
      await fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  };

  return {
    candidates,
    loading,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    refetch: fetchCandidates,
  };
};
