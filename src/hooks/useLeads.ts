/**
 * useLeads Hook - Realtime listener version
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as leadService from '../services/leadService';
import { Lead, LeadStatus, LeadSource } from '../services/leadService';

interface UseLeadsProps {
  status?: LeadStatus;
  source?: LeadSource;
}

interface UseLeadsReturn {
  leads: Lead[];
  stats: Record<LeadStatus, number>;
  loading: boolean;
  error: string | null;
  createLead: (data: Omit<Lead, 'id'>) => Promise<string>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<void>;
  updateStatus: (id: string, status: LeadStatus) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  assignLeads: (ids: string[], assignedTo: string, name: string) => Promise<void>;
  refresh: () => void;
}

const DEFAULT_STATS: Record<LeadStatus, number> = {
  'Mới': 0, 'Đang liên hệ': 0, 'Quan tâm': 0, 'Hẹn test': 0, 'Đã test': 0, 'Đăng ký': 0, 'Từ chối': 0,
};

export const useLeads = (props?: UseLeadsProps): UseLeadsReturn => {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Realtime listener
  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Lead));
        setAllLeads(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to leads:', err);
        setError(err.message || 'Không thể tải danh sách khách hàng');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter leads based on props
  const leads = useMemo(() => {
    let filtered = allLeads;
    if (props?.status) {
      filtered = filtered.filter(l => l.status === props.status);
    }
    if (props?.source) {
      filtered = filtered.filter(l => l.source === props.source);
    }
    return filtered;
  }, [allLeads, props?.status, props?.source]);

  // Calculate stats from all leads
  const stats = useMemo(() => {
    const result = { ...DEFAULT_STATS };
    allLeads.forEach(lead => {
      if (result[lead.status] !== undefined) {
        result[lead.status]++;
      }
    });
    return result;
  }, [allLeads]);

  const createLead = async (data: Omit<Lead, 'id'>): Promise<string> => {
    return await leadService.createLead(data);
  };

  const updateLead = async (id: string, data: Partial<Lead>): Promise<void> => {
    await leadService.updateLead(id, data);
  };

  const updateStatus = async (id: string, status: LeadStatus): Promise<void> => {
    await leadService.updateLeadStatus(id, status);
  };

  const deleteLead = async (id: string): Promise<void> => {
    await leadService.deleteLead(id);
  };

  const assignLeads = async (ids: string[], assignedTo: string, name: string): Promise<void> => {
    await leadService.assignLeads(ids, assignedTo, name);
  };

  return {
    leads,
    stats,
    loading,
    error,
    createLead,
    updateLead,
    updateStatus,
    deleteLead,
    assignLeads,
    refresh: () => {}, // No-op, realtime updates automatically
  };
};
