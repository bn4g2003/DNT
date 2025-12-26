/**
 * Parent Service (Refactored)
 * - Parents collection: chỉ lưu thông tin PH
 * - Children: query từ students collection by parentId
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
import { Parent, Student } from '../../types';

const PARENTS_COLLECTION = 'parents';
const STUDENTS_COLLECTION = 'students';

export interface ParentWithChildren extends Parent {
  children: Student[];
}

/**
 * Create new parent
 */
export const createParent = async (data: Omit<Parent, 'id'>): Promise<string> => {
  try {
    const parentData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, PARENTS_COLLECTION), parentData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating parent:', error);
    throw new Error('Không thể tạo phụ huynh');
  }
};

/**
 * Get parent by ID
 */
export const getParent = async (id: string): Promise<Parent | null> => {
  try {
    const docRef = doc(db, PARENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Parent;
  } catch (error) {
    console.error('Error getting parent:', error);
    throw new Error('Không thể tải thông tin phụ huynh');
  }
};

/**
 * Get all parents with optional search
 */
export const getParents = async (searchTerm?: string): Promise<Parent[]> => {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    
    const q = query(collection(db, PARENTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    let parents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Parent));
    
    // Client-side search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      parents = parents.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.phone.includes(term)
      );
    }
    
    return parents;
  } catch (error) {
    console.error('Error getting parents:', error);
    throw new Error('Không thể tải danh sách phụ huynh');
  }
};

/**
 * Get children of a parent (query from students collection)
 */
export const getChildrenByParentId = async (parentId: string): Promise<Student[]> => {
  try {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dob: doc.data().dob?.toDate?.()?.toISOString() || doc.data().dob || '',
    } as Student));
  } catch (error) {
    console.error('Error getting children:', error);
    return [];
  }
};

/**
 * Get all parents with their children
 */
export const getParentsWithChildren = async (searchTerm?: string): Promise<ParentWithChildren[]> => {
  try {
    const parents = await getParents(searchTerm);
    
    // Get children for each parent
    const parentsWithChildren = await Promise.all(
      parents.map(async (parent) => {
        const children = await getChildrenByParentId(parent.id);
        return { ...parent, children };
      })
    );
    
    return parentsWithChildren;
  } catch (error) {
    console.error('Error getting parents with children:', error);
    throw new Error('Không thể tải danh sách phụ huynh');
  }
};

/**
 * Find parent by phone number
 */
export const findParentByPhone = async (phone: string): Promise<Parent | null> => {
  try {
    const q = query(
      collection(db, PARENTS_COLLECTION),
      where('phone', '==', phone)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Parent;
  } catch (error) {
    console.error('Error finding parent by phone:', error);
    return null;
  }
};

/**
 * Update parent and sync to all related students
 */
export const updateParent = async (id: string, data: Partial<Parent>): Promise<void> => {
  try {
    const docRef = doc(db, PARENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    
    // Sync to all students with this parentId
    if (data.name || data.phone) {
      const children = await getChildrenByParentId(id);
      const studentUpdates: any = {};
      if (data.name) studentUpdates.parentName = data.name;
      if (data.phone) studentUpdates.parentPhone = data.phone;
      
      // Update each student's denormalized parent fields
      for (const child of children) {
        const studentDocRef = doc(db, STUDENTS_COLLECTION, child.id);
        await updateDoc(studentDocRef, {
          ...studentUpdates,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error updating parent:', error);
    throw new Error('Không thể cập nhật phụ huynh');
  }
};

/**
 * Delete parent (only if no children)
 */
export const deleteParent = async (id: string): Promise<void> => {
  try {
    // Check if parent has children
    const children = await getChildrenByParentId(id);
    if (children.length > 0) {
      throw new Error('Không thể xóa phụ huynh đang có học sinh');
    }
    
    const docRef = doc(db, PARENTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting parent:', error);
    throw error;
  }
};
