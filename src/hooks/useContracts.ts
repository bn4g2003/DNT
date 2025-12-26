/**
 * useContracts Hook
 * React hook for contract operations
 */

import { useState, useEffect } from 'react';
import { Contract, ContractStatus, ContractType } from '../../types';
import * as contractService from '../services/contractService';

interface UseContractsProps {
  studentId?: string;
  status?: ContractStatus;
  type?: ContractType;
}

interface UseContractsReturn {
  contracts: Contract[];
  loading: boolean;
  error: string | null;
  createContract: (data: Partial<Contract>) => Promise<string>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  recordPayment: (id: string, amount: number, paymentDate?: string) => Promise<void>;
  updateStatus: (id: string, status: ContractStatus) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useContracts = (props?: UseContractsProps): UseContractsReturn => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractService.getContracts(props);
      setContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [props?.studentId, props?.status, props?.type]);

  const createContract = async (data: Partial<Contract>): Promise<string> => {
    const id = await contractService.createContract(data);
    await fetchContracts();
    return id;
  };

  const updateContract = async (id: string, data: Partial<Contract>): Promise<void> => {
    await contractService.updateContract(id, data);
    await fetchContracts();
  };

  const deleteContract = async (id: string): Promise<void> => {
    await contractService.deleteContract(id);
    await fetchContracts();
  };

  const recordPayment = async (
    id: string,
    amount: number,
    paymentDate?: string
  ): Promise<void> => {
    await contractService.recordPayment(id, amount, paymentDate);
    await fetchContracts();
  };

  const updateStatus = async (id: string, status: ContractStatus): Promise<void> => {
    await contractService.updateContractStatus(id, status);
    await fetchContracts();
  };

  return {
    contracts,
    loading,
    error,
    createContract,
    updateContract,
    deleteContract,
    recordPayment,
    updateStatus,
    refresh: fetchContracts,
  };
};
