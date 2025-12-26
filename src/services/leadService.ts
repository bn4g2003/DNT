/**
 * Lead Service
 * Handle customer leads/potential students CRUD
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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const LEADS_COLLECTION = 'leads';

export type LeadStatus = 'Mới' | 'Đang liên hệ' | 'Quan tâm' | 'Hẹn test' | 'Đã test' | 'Đăng ký' | 'Từ chối';
export type LeadSource = 'Facebook' | 'Zalo' | 'Website' | 'Giới thiệu' | 'Walk-in' | 'Khác';

export interface Lead {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  childName?: string;
  childAge?: number;
  source: LeadSource;
  status: LeadStatus;
  assignedTo?: string;
  assignedToName?: string;
  // Support multiple campaigns
  campaignIds?: string[];
  campaignNames?: string[];
  // Legacy single campaign (for backward compatibility)
  campaignId?: string;
  campaignName?: string;
  note?: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createLead = async (data: Omit<Lead, 'id'>): Promise<string> => {
  try {
    const leadData = {
      ...data,
      status: data.status || 'Mới',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, LEADS_COLLECTION), leadData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw new Error('Không thể tạo khách hàng tiềm năng');
  }
};

export const getLeads = async (filters?: {
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
}): Promise<Lead[]> => {
  try {
    let q = query(collection(db, LEADS_COLLECTION), orderBy('createdAt', 'desc'));
    
    if (filters?.status) {
      q = query(collection(db, LEADS_COLLECTION), where('status', '==', filters.status), orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    let leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Lead));
    
    // Client-side filtering
    if (filters?.source) {
      leads = leads.filter(l => l.source === filters.source);
    }
    if (filters?.assignedTo) {
      leads = leads.filter(l => l.assignedTo === filters.assignedTo);
    }
    
    return leads;
  } catch (error) {
    console.error('Error getting leads:', error);
    throw new Error('Không thể tải danh sách khách hàng');
  }
};

export const updateLead = async (id: string, data: Partial<Lead>): Promise<void> => {
  try {
    const docRef = doc(db, LEADS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    throw new Error('Không thể cập nhật khách hàng');
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, LEADS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw new Error('Không thể xóa khách hàng');
  }
};

export const assignLeads = async (leadIds: string[], assignedTo: string, assignedToName: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    
    leadIds.forEach(id => {
      const docRef = doc(db, LEADS_COLLECTION, id);
      batch.update(docRef, { assignedTo, assignedToName, updatedAt: now });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error assigning leads:', error);
    throw new Error('Không thể phân công khách hàng');
  }
};

export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<void> => {
  await updateLead(id, { status, lastContactDate: new Date().toISOString() });
};

export const getLeadStats = async (): Promise<Record<LeadStatus, number>> => {
  const leads = await getLeads();
  const stats: Record<LeadStatus, number> = {
    'Mới': 0,
    'Đang liên hệ': 0,
    'Quan tâm': 0,
    'Hẹn test': 0,
    'Đã test': 0,
    'Đăng ký': 0,
    'Từ chối': 0,
  };
  
  leads.forEach(lead => {
    if (stats[lead.status] !== undefined) {
      stats[lead.status]++;
    }
  });
  
  return stats;
};
