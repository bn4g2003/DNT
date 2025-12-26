/**
 * useCampaigns Hook
 */

import { useState, useEffect } from 'react';
import * as campaignService from '../services/campaignService';
import { Campaign, CampaignStatus } from '../services/campaignService';

interface UseCampaignsReturn {
  campaigns: Campaign[];
  activeCampaigns: Campaign[];
  loading: boolean;
  error: string | null;
  createCampaign: (data: Omit<Campaign, 'id'>) => Promise<string>;
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  incrementRegistered: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCampaigns = (includeEnded: boolean = false): UseCampaignsReturn => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignService.getCampaigns(includeEnded);
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [includeEnded]);

  const activeCampaigns = campaigns.filter(c => c.status === 'Đang mở');

  const createCampaign = async (data: Omit<Campaign, 'id'>): Promise<string> => {
    const id = await campaignService.createCampaign(data);
    await fetchCampaigns();
    return id;
  };

  const updateCampaign = async (id: string, data: Partial<Campaign>): Promise<void> => {
    await campaignService.updateCampaign(id, data);
    await fetchCampaigns();
  };

  const deleteCampaign = async (id: string): Promise<void> => {
    await campaignService.deleteCampaign(id);
    await fetchCampaigns();
  };

  const incrementRegistered = async (id: string): Promise<void> => {
    await campaignService.incrementRegistered(id);
    await fetchCampaigns();
  };

  return {
    campaigns,
    activeCampaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    incrementRegistered,
    refresh: fetchCampaigns,
  };
};
