/**
 * Campaign Service
 * Handle marketing campaigns CRUD
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const CAMPAIGNS_COLLECTION = 'campaigns';

export type CampaignStatus = 'Đang mở' | 'Tạm dừng' | 'Kết thúc';

export interface Campaign {
  id?: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  targetCount: number;
  registeredCount: number;
  conversionRate?: number;
  scriptUrl?: string;
  assignedTo?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const createCampaign = async (data: Omit<Campaign, 'id'>): Promise<string> => {
  try {
    const campaignData = {
      ...data,
      targetCount: data.targetCount || 0,
      registeredCount: data.registeredCount || 0,
      conversionRate: 0,
      status: data.status || 'Đang mở',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, CAMPAIGNS_COLLECTION), campaignData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw new Error('Không thể tạo chiến dịch');
  }
};

export const getCampaigns = async (includeEnded: boolean = false): Promise<Campaign[]> => {
  try {
    let q = query(collection(db, CAMPAIGNS_COLLECTION), orderBy('createdAt', 'desc'));
    
    if (!includeEnded) {
      q = query(collection(db, CAMPAIGNS_COLLECTION), where('status', '!=', 'Kết thúc'), orderBy('status'), orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const conversionRate = data.targetCount > 0 
        ? (data.registeredCount / data.targetCount) * 100 
        : 0;
      return {
        id: doc.id,
        ...data,
        conversionRate,
      } as Campaign;
    });
  } catch (error) {
    console.error('Error getting campaigns:', error);
    // Fallback without complex query
    const snapshot = await getDocs(collection(db, CAMPAIGNS_COLLECTION));
    let campaigns = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        conversionRate: data.targetCount > 0 ? (data.registeredCount / data.targetCount) * 100 : 0,
      } as Campaign;
    });
    
    if (!includeEnded) {
      campaigns = campaigns.filter(c => c.status !== 'Kết thúc');
    }
    
    return campaigns.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
};

export const updateCampaign = async (id: string, data: Partial<Campaign>): Promise<void> => {
  try {
    const docRef = doc(db, CAMPAIGNS_COLLECTION, id);
    
    // Recalculate conversion rate if counts changed
    let updateData = { ...data };
    if (data.registeredCount !== undefined || data.targetCount !== undefined) {
      const registered = data.registeredCount ?? 0;
      const target = data.targetCount ?? 1;
      updateData.conversionRate = target > 0 ? (registered / target) * 100 : 0;
    }
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw new Error('Không thể cập nhật chiến dịch');
  }
};

export const deleteCampaign = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, CAMPAIGNS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw new Error('Không thể xóa chiến dịch');
  }
};

export const incrementRegistered = async (id: string): Promise<void> => {
  const campaigns = await getCampaigns(true);
  const campaign = campaigns.find(c => c.id === id);
  if (campaign) {
    await updateCampaign(id, { 
      registeredCount: (campaign.registeredCount || 0) + 1,
      targetCount: campaign.targetCount,
    });
  }
};
