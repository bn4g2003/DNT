/**
 * Resource Library Service
 * Quản lý thư viện tài nguyên: video, tài liệu, link web
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Resource, ResourceFolder } from '../../types';

const RESOURCES_COLLECTION = 'resources';
const FOLDERS_COLLECTION = 'resource_folders';

// ==========================================
// FOLDER OPERATIONS
// ==========================================

export const getFolders = async (parentId?: string): Promise<ResourceFolder[]> => {
  try {
    let q;
    if (parentId === undefined) {
      q = query(collection(db, FOLDERS_COLLECTION), orderBy('order', 'asc'));
    } else if (parentId === null || parentId === '') {
      q = query(
        collection(db, FOLDERS_COLLECTION),
        where('parentId', '==', null),
        orderBy('order', 'asc')
      );
    } else {
      q = query(
        collection(db, FOLDERS_COLLECTION),
        where('parentId', '==', parentId),
        orderBy('order', 'asc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ResourceFolder[];
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

export const getAllFolders = async (): Promise<ResourceFolder[]> => {
  try {
    const q = query(collection(db, FOLDERS_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ResourceFolder[];
  } catch (error) {
    console.error('Error fetching all folders:', error);
    throw error;
  }
};


export const createFolder = async (data: Omit<ResourceFolder, 'id'>): Promise<string> => {
  try {
    const folderData = {
      ...data,
      parentId: data.parentId || null,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), folderData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

export const updateFolder = async (id: string, data: Partial<ResourceFolder>): Promise<void> => {
  try {
    const docRef = doc(db, FOLDERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
};

export const deleteFolder = async (id: string): Promise<void> => {
  try {
    // Delete all resources in folder
    const resourcesQuery = query(
      collection(db, RESOURCES_COLLECTION),
      where('folderId', '==', id)
    );
    const resourcesSnap = await getDocs(resourcesQuery);
    for (const doc of resourcesSnap.docs) {
      await deleteDoc(doc.ref);
    }
    
    // Delete all subfolders recursively
    const subfoldersQuery = query(
      collection(db, FOLDERS_COLLECTION),
      where('parentId', '==', id)
    );
    const subfoldersSnap = await getDocs(subfoldersQuery);
    for (const doc of subfoldersSnap.docs) {
      await deleteFolder(doc.id);
    }
    
    // Delete the folder itself
    await deleteDoc(doc(db, FOLDERS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// ==========================================
// RESOURCE OPERATIONS
// ==========================================

export const getResources = async (folderId?: string): Promise<Resource[]> => {
  try {
    let q;
    if (folderId === undefined) {
      q = query(collection(db, RESOURCES_COLLECTION), orderBy('createdAt', 'desc'));
    } else if (folderId === null || folderId === '') {
      q = query(
        collection(db, RESOURCES_COLLECTION),
        where('folderId', '==', null),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, RESOURCES_COLLECTION),
        where('folderId', '==', folderId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Resource[];
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

export const getAllResources = async (): Promise<Resource[]> => {
  try {
    const q = query(collection(db, RESOURCES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Resource[];
  } catch (error) {
    console.error('Error fetching all resources:', error);
    throw error;
  }
};

export const getResourceById = async (id: string): Promise<Resource | null> => {
  try {
    const docRef = doc(db, RESOURCES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Resource;
    }
    return null;
  } catch (error) {
    console.error('Error fetching resource:', error);
    throw error;
  }
};

export const createResource = async (data: Omit<Resource, 'id'>): Promise<string> => {
  try {
    const resourceData = {
      ...data,
      folderId: data.folderId || null,
      viewCount: 0,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), resourceData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

export const updateResource = async (id: string, data: Partial<Resource>): Promise<void> => {
  try {
    const docRef = doc(db, RESOURCES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

export const deleteResource = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, RESOURCES_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

export const incrementViewCount = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, RESOURCES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentCount = docSnap.data().viewCount || 0;
      await updateDoc(docRef, { viewCount: currentCount + 1 });
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};

export const incrementDownloadCount = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, RESOURCES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentCount = docSnap.data().downloadCount || 0;
      await updateDoc(docRef, { downloadCount: currentCount + 1 });
    }
  } catch (error) {
    console.error('Error incrementing download count:', error);
  }
};

// Search resources by name or tags
export const searchResources = async (searchTerm: string): Promise<Resource[]> => {
  try {
    const allResources = await getAllResources();
    const term = searchTerm.toLowerCase();
    return allResources.filter(r => 
      r.name.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term) ||
      r.tags?.some(t => t.toLowerCase().includes(term))
    );
  } catch (error) {
    console.error('Error searching resources:', error);
    throw error;
  }
};
