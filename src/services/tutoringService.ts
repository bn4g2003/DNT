/**
 * Tutoring Service
 * Handle tutoring CRUD operations with Firestore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const TUTORING_COLLECTION = 'tutoring';

export type TutoringType = 'Nghỉ học' | 'Học yếu';
export type TutoringStatus = 'Chưa bồi' | 'Đã hẹn' | 'Đã bồi' | 'Hủy';

export interface TutoringData {
  id?: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  type: TutoringType;
  status: TutoringStatus;
  absentDate?: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  tutor?: string | null;
  tutorName?: string | null;
  note?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create new tutoring record
 */
export const createTutoring = async (data: Omit<TutoringData, 'id'>): Promise<string> => {
  try {
    const tutoringData = {
      ...data,
      status: data.status || 'Chưa bồi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, TUTORING_COLLECTION), tutoringData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating tutoring:', error);
    throw new Error('Không thể tạo lịch bồi bài');
  }
};

/**
 * Get tutoring by ID
 */
export const getTutoring = async (id: string): Promise<TutoringData | null> => {
  try {
    const docRef = doc(db, TUTORING_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return { id: docSnap.id, ...docSnap.data() } as TutoringData;
  } catch (error) {
    console.error('Error getting tutoring:', error);
    throw new Error('Không thể tải thông tin bồi bài');
  }
};

/**
 * Get tutoring records with filters
 */
export const getTutoringList = async (filters?: {
  type?: TutoringType;
  status?: TutoringStatus;
  studentId?: string;
  classId?: string;
}): Promise<TutoringData[]> => {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    
    if (filters?.type) {
      constraints.unshift(where('type', '==', filters.type));
    }
    
    if (filters?.status) {
      constraints.unshift(where('status', '==', filters.status));
    }
    
    if (filters?.studentId) {
      constraints.unshift(where('studentId', '==', filters.studentId));
    }
    
    if (filters?.classId) {
      constraints.unshift(where('classId', '==', filters.classId));
    }
    
    const q = query(collection(db, TUTORING_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as TutoringData));
  } catch (error) {
    console.error('Error getting tutoring list:', error);
    throw new Error('Không thể tải danh sách bồi bài');
  }
};

/**
 * Update tutoring record
 */
export const updateTutoring = async (id: string, data: Partial<TutoringData>): Promise<void> => {
  try {
    const docRef = doc(db, TUTORING_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating tutoring:', error);
    throw new Error('Không thể cập nhật lịch bồi bài');
  }
};

/**
 * Schedule tutoring session
 */
export const scheduleTutoring = async (
  id: string,
  date: string,
  time: string,
  tutorId: string,
  tutorName: string
): Promise<void> => {
  try {
    await updateTutoring(id, {
      scheduledDate: date,
      scheduledTime: time,
      tutor: tutorId,
      tutorName: tutorName,
      status: 'Đã hẹn',
    });
  } catch (error) {
    console.error('Error scheduling tutoring:', error);
    throw new Error('Không thể đặt lịch bồi bài');
  }
};

/**
 * Mark tutoring as completed
 */
export const completeTutoring = async (id: string, note?: string): Promise<void> => {
  try {
    console.log('completeTutoring called with id:', id);
    const docRef = doc(db, TUTORING_COLLECTION, id);
    await updateDoc(docRef, {
      status: 'Đã bồi',
      completedAt: new Date().toISOString(),
      ...(note && { note }),
      updatedAt: new Date().toISOString(),
    });
    console.log('completeTutoring success');
  } catch (error: any) {
    console.error('Error completing tutoring:', error);
    console.error('Error code:', error?.code);
    throw new Error(`Không thể hoàn thành bồi bài: ${error?.message || 'Unknown'}`);
  }
};

/**
 * Cancel tutoring
 */
export const cancelTutoring = async (id: string, reason?: string): Promise<void> => {
  try {
    await updateTutoring(id, {
      status: 'Hủy',
      note: reason,
    });
  } catch (error) {
    console.error('Error canceling tutoring:', error);
    throw new Error('Không thể hủy lịch bồi bài');
  }
};

/**
 * Delete tutoring record
 */
export const deleteTutoring = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, TUTORING_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting tutoring:', error);
    throw new Error('Không thể xóa lịch bồi bài');
  }
};
