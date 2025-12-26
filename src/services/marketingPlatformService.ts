/**
 * Marketing Platform Service
 * CRUD operations cho Marketing Platforms và Stats
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
import { MarketingPlatform, PlatformMonthlyStats } from '../types/marketingTypes';

const PLATFORMS_COLLECTION = 'marketingPlatforms';
const STATS_COLLECTION = 'platformMonthlyStats';

// Default platforms
export const DEFAULT_PLATFORMS = [
    { name: 'Facebook', icon: '📘', color: '#1877F2' },
    { name: 'Zalo', icon: '💬', color: '#0068FF' },
    { name: 'TikTok', icon: '🎵', color: '#000000' },
    { name: 'Instagram', icon: '📷', color: '#E4405F' },
    { name: 'YouTube', icon: '▶️', color: '#FF0000' },
    { name: 'Google Ads', icon: '🔍', color: '#4285F4' },
    { name: 'Website', icon: '🌐', color: '#6366F1' },
];

// ==================== PLATFORMS ====================

// Get all platforms
export const getPlatforms = async (): Promise<MarketingPlatform[]> => {
    try {
        const q = query(collection(db, PLATFORMS_COLLECTION), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as MarketingPlatform));
    } catch (error) {
        console.error('Error getting platforms:', error);
        throw error;
    }
};

// Create platform
export const createPlatform = async (data: Omit<MarketingPlatform, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, PLATFORMS_COLLECTION), {
            ...data,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating platform:', error);
        throw error;
    }
};

// Update platform
export const updatePlatform = async (id: string, data: Partial<MarketingPlatform>): Promise<void> => {
    try {
        const docRef = doc(db, PLATFORMS_COLLECTION, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error updating platform:', error);
        throw error;
    }
};

// Delete platform
export const deletePlatform = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, PLATFORMS_COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting platform:', error);
        throw error;
    }
};

// Initialize default platforms
export const initializeDefaultPlatforms = async (): Promise<void> => {
    try {
        const existing = await getPlatforms();
        if (existing.length > 0) return; // Already initialized

        for (const platform of DEFAULT_PLATFORMS) {
            await createPlatform({
                ...platform,
                isActive: true,
            });
        }
        console.log('Default platforms initialized');
    } catch (error) {
        console.error('Error initializing platforms:', error);
    }
};

// ==================== MONTHLY STATS ====================

// Get stats by month
export const getStatsByMonth = async (month: string): Promise<PlatformMonthlyStats[]> => {
    try {
        const q = query(
            collection(db, STATS_COLLECTION),
            where('month', '==', month),
            orderBy('platformName', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as PlatformMonthlyStats));
    } catch (error) {
        console.error('Error getting stats:', error);
        // Fallback without orderBy if index not created
        try {
            const q2 = query(
                collection(db, STATS_COLLECTION),
                where('month', '==', month)
            );
            const snapshot2 = await getDocs(q2);
            return snapshot2.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as PlatformMonthlyStats));
        } catch (err2) {
            console.error('Fallback also failed:', err2);
            return [];
        }
    }
};

// Get or create stats for platform/month
export const getOrCreateStats = async (
    platformId: string,
    platformName: string,
    month: string
): Promise<PlatformMonthlyStats> => {
    try {
        const stats = await getStatsByMonth(month);
        const existing = stats.find(s => s.platformId === platformId);

        if (existing) return existing;

        // Create new stats
        const now = new Date().toISOString();
        const newStats: Omit<PlatformMonthlyStats, 'id'> = {
            platformId,
            platformName,
            month,
            newFollowers: 0,
            interactions: 0,
            newMessages: 0,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = await addDoc(collection(db, STATS_COLLECTION), newStats);
        return { id: docRef.id, ...newStats };
    } catch (error) {
        console.error('Error getting/creating stats:', error);
        throw error;
    }
};

// Update stats
export const updateStats = async (id: string, data: Partial<PlatformMonthlyStats>): Promise<void> => {
    try {
        const docRef = doc(db, STATS_COLLECTION, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error updating stats:', error);
        throw error;
    }
};

// Create stats
export const createStats = async (data: Omit<PlatformMonthlyStats, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, STATS_COLLECTION), {
            ...data,
            createdAt: now,
            updatedAt: now,
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating stats:', error);
        throw error;
    }
};
