import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { StaffContract } from '../../types';

export const useStaffContract = () => {
  const [contracts, setContracts] = useState<StaffContract[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all contracts
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'staffContracts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data: StaffContract[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as StaffContract);
      });
      setContracts(data);
    } catch (error) {
      console.error('Error fetching staff contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Create contract
  const createContract = async (contractData: Omit<StaffContract, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'staffContracts'), {
        ...contractData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await fetchContracts();
      return docRef.id;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  };

  // Update contract
  const updateContract = async (id: string, contractData: Partial<StaffContract>) => {
    try {
      const docRef = doc(db, 'staffContracts', id);
      await updateDoc(docRef, {
        ...contractData,
        updatedAt: new Date().toISOString(),
      });
      await fetchContracts();
    } catch (error) {
      console.error('Error updating contract:', error);
      throw error;
    }
  };

  // Delete contract
  const deleteContract = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staffContracts', id));
      await fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }
  };

  // Get contracts by staff ID
  const getContractsByStaff = async (staffId: string) => {
    try {
      const q = query(
        collection(db, 'staffContracts'),
        where('staffId', '==', staffId),
        orderBy('startDate', 'desc')
      );
      const snapshot = await getDocs(q);
      const data: StaffContract[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as StaffContract);
      });
      return data;
    } catch (error) {
      console.error('Error fetching contracts by staff:', error);
      return [];
    }
  };

  return {
    contracts,
    loading,
    createContract,
    updateContract,
    deleteContract,
    getContractsByStaff,
    refetch: fetchContracts,
  };
};
