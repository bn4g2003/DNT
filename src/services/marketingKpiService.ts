/**
 * Marketing KPI Service
 * CRUD operations cho Marketing KPIs
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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MarketingKpi, StaffPerformance } from '../types/marketingTypes';

const COLLECTION = 'marketingKpis';

// Get all KPIs
export const getKpis = async (filters?: {
    staffId?: string;
    month?: string;
}): Promise<MarketingKpi[]> => {
    try {
        let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);
        let kpis = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as MarketingKpi));

        // Client-side filtering
        if (filters?.staffId) {
            kpis = kpis.filter(k => k.staffId === filters.staffId);
        }
        if (filters?.month) {
            kpis = kpis.filter(k => k.month === filters.month);
        }

        return kpis;
    } catch (error) {
        console.error('Error getting KPIs:', error);
        throw error;
    }
};

// Get single KPI
export const getKpi = async (id: string): Promise<MarketingKpi | null> => {
    try {
        const docRef = doc(db, COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as MarketingKpi;
    } catch (error) {
        console.error('Error getting KPI:', error);
        throw error;
    }
};

// Create KPI
export const createKpi = async (data: Omit<MarketingKpi, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, COLLECTION), {
            ...data,
            createdAt: now,
            updatedAt: now,
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating KPI:', error);
        throw error;
    }
};

// Update KPI
export const updateKpi = async (id: string, data: Partial<MarketingKpi>): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error updating KPI:', error);
        throw error;
    }
};

// Delete KPI
export const deleteKpi = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting KPI:', error);
        throw error;
    }
};

// Calculate single KPI completion percentage
export const calculateKpiPercent = (kpi: MarketingKpi): number => {
    if (kpi.targetValue === 0) return 0;
    const rawPercent = (kpi.actualValue / kpi.targetValue) * 100;
    return Math.min(100, Math.round(rawPercent)); // Cap at 100%
};

// Calculate weighted KPI completion for a staff member
export const calculateStaffKpiCompletion = (kpis: MarketingKpi[], staffId: string): number => {
    const staffKpis = kpis.filter(k => k.staffId === staffId);
    if (staffKpis.length === 0) return 0;

    let totalWeightedPercent = 0;
    let totalWeight = 0;

    staffKpis.forEach(kpi => {
        const kpiPercent = calculateKpiPercent(kpi);
        const weightedPercent = (kpiPercent * kpi.weight) / 100;
        totalWeightedPercent += weightedPercent;
        totalWeight += kpi.weight;
    });

    // Normalize if weights don't add up to 100
    if (totalWeight === 0) return 0;
    return Math.round((totalWeightedPercent / totalWeight) * 100);
};

// Calculate overall staff performance
export const calculateOverallPerformance = (
    taskPercent: number,
    kpiPercent: number
): number => {
    return Math.round((taskPercent + kpiPercent) / 2);
};
