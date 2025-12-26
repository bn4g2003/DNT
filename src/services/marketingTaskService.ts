/**
 * Marketing Task Service
 * CRUD operations cho Marketing Tasks
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
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MarketingTask } from '../types/marketingTypes';

const COLLECTION = 'marketingTasks';

// Get all tasks
export const getTasks = async (filters?: {
    status?: string;
    assignedTo?: string;
    campaignId?: string;
}): Promise<MarketingTask[]> => {
    try {
        let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);
        let tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as MarketingTask));

        // Client-side filtering to avoid composite index requirements
        if (filters?.status) {
            tasks = tasks.filter(t => t.status === filters.status);
        }
        if (filters?.assignedTo) {
            tasks = tasks.filter(t => t.assignedTo.includes(filters.assignedTo));
        }
        if (filters?.campaignId) {
            tasks = tasks.filter(t => t.campaignId === filters.campaignId);
        }

        return tasks;
    } catch (error) {
        console.error('Error getting tasks:', error);
        throw error;
    }
};

// Get single task
export const getTask = async (id: string): Promise<MarketingTask | null> => {
    try {
        const docRef = doc(db, COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as MarketingTask;
    } catch (error) {
        console.error('Error getting task:', error);
        throw error;
    }
};

// Create task
export const createTask = async (data: Omit<MarketingTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, COLLECTION), {
            ...data,
            createdAt: now,
            updatedAt: now,
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
};

// Update task
export const updateTask = async (id: string, data: Partial<MarketingTask>): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

// Delete task
export const deleteTask = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};

// Calculate staff task completion
export const calculateStaffTaskCompletion = (tasks: MarketingTask[], staffId: string): number => {
    const staffTasks = tasks.filter(t => t.assignedTo.includes(staffId));
    if (staffTasks.length === 0) return 0;

    const totalCompletion = staffTasks.reduce((sum, t) => sum + (t.completionPercent || 0), 0);
    return Math.round(totalCompletion / staffTasks.length);
};
