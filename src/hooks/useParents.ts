/**
 * useParents Hook (Realtime)
 * - Sử dụng onSnapshot để tự động cập nhật khi data thay đổi
 */

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Parent, Student } from '../../types';
import * as parentService from '../services/parentService';
import { ParentWithChildren } from '../services/parentService';

interface UseParentsReturn {
  parents: ParentWithChildren[];
  loading: boolean;
  error: string | null;
  createParent: (data: Omit<Parent, 'id'>) => Promise<string>;
  updateParent: (id: string, data: Partial<Parent>) => Promise<void>;
  deleteParent: (id: string) => Promise<void>;
  findByPhone: (phone: string) => Promise<Parent | null>;
  refresh: () => Promise<void>;
}

export const useParents = (searchTerm?: string): UseParentsReturn => {
  const [parents, setParents] = useState<ParentWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Realtime listener for parents
  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(collection(db, 'parents'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      async (snapshot) => {
        try {
          let parentsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Parent));

          // Client-side search
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            parentsList = parentsList.filter(p => 
              p.name.toLowerCase().includes(term) ||
              p.phone.includes(term)
            );
          }

          // Fetch children for each parent
          const parentsWithChildren = await Promise.all(
            parentsList.map(async (parent) => {
              const children = await parentService.getChildrenByParentId(parent.id);
              return { ...parent, children };
            })
          );

          setParents(parentsWithChildren);
          setLoading(false);
        } catch (err) {
          console.error('Error processing parents:', err);
          setError('Không thể tải danh sách phụ huynh');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Snapshot error:', err);
        setError('Lỗi kết nối realtime');
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [searchTerm]);

  const createParent = async (data: Omit<Parent, 'id'>): Promise<string> => {
    return parentService.createParent(data);
  };

  const updateParent = async (id: string, data: Partial<Parent>): Promise<void> => {
    await parentService.updateParent(id, data);
  };

  const deleteParent = async (id: string): Promise<void> => {
    await parentService.deleteParent(id);
  };

  const findByPhone = async (phone: string): Promise<Parent | null> => {
    return parentService.findParentByPhone(phone);
  };

  const refresh = async () => {
    // With realtime listener, manual refresh is not needed
    // But keep for backward compatibility
  };

  return {
    parents,
    loading,
    error,
    createParent,
    updateParent,
    deleteParent,
    findByPhone,
    refresh,
  };
};
