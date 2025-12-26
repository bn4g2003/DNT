/**
 * Curriculum Service
 * Handle curriculum/course programs CRUD
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const CURRICULUMS_COLLECTION = 'curriculums';

export type CurriculumLevel = 'Beginner' | 'Elementary' | 'Intermediate' | 'Advanced';
export type CurriculumStatus = 'Active' | 'Inactive' | 'Draft';

export interface Curriculum {
  id?: string;
  name: string;
  code: string;
  description?: string;
  level: CurriculumLevel;
  ageRange?: string;
  duration: number; // in months
  totalSessions: number;
  sessionDuration: number; // in minutes
  tuitionFee: number;
  materials?: string[];
  objectives?: string[];
  status: CurriculumStatus;
  createdAt?: string;
  updatedAt?: string;
}

export const createCurriculum = async (data: Omit<Curriculum, 'id'>): Promise<string> => {
  try {
    const curriculumData = {
      ...data,
      status: data.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, CURRICULUMS_COLLECTION), curriculumData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating curriculum:', error);
    throw new Error('Không thể tạo giáo trình');
  }
};

export const getCurriculums = async (): Promise<Curriculum[]> => {
  try {
    const q = query(collection(db, CURRICULUMS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Curriculum));
  } catch (error) {
    console.error('Error getting curriculums:', error);
    throw new Error('Không thể tải danh sách giáo trình');
  }
};

export const updateCurriculum = async (id: string, data: Partial<Curriculum>): Promise<void> => {
  try {
    const docRef = doc(db, CURRICULUMS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating curriculum:', error);
    throw new Error('Không thể cập nhật giáo trình');
  }
};

export const deleteCurriculum = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, CURRICULUMS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting curriculum:', error);
    throw new Error('Không thể xóa giáo trình');
  }
};
