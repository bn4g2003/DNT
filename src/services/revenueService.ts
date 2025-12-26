/**
 * Revenue Service
 * Aggregate revenue data from contracts
 */

import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const CONTRACTS_COLLECTION = 'contracts';

export interface RevenueByMonth {
  month: string;
  year: number;
  totalRevenue: number;
  paidCount: number;
  debtAmount: number;
  debtCount: number;
}

export interface RevenueByClass {
  classId: string;
  className: string;
  totalRevenue: number;
  studentCount: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  paidRevenue: number;
  debtAmount: number;
  totalContracts: number;
  paidContracts: number;
  debtContracts: number;
  byMonth: RevenueByMonth[];
  byClass: RevenueByClass[];
}

export const getRevenueSummary = async (year?: number): Promise<RevenueSummary> => {
  try {
    const snapshot = await getDocs(collection(db, CONTRACTS_COLLECTION));
    const contracts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const targetYear = year || new Date().getFullYear();
    
    let totalRevenue = 0;
    let paidRevenue = 0;
    let debtAmount = 0;
    let paidContracts = 0;
    let debtContracts = 0;
    
    const monthMap = new Map<string, RevenueByMonth>();
    const classMap = new Map<string, RevenueByClass>();
    
    contracts.forEach((contract: any) => {
      const amount = contract.finalTotal || contract.totalAmount || 0;
      const status = contract.status;
      const createdAt = contract.createdAt ? new Date(contract.createdAt) : new Date();
      const contractYear = createdAt.getFullYear();
      
      // Filter by year
      if (contractYear !== targetYear) return;
      
      totalRevenue += amount;
      
      if (status === 'Paid' || status === 'Đã thanh toán') {
        paidRevenue += amount;
        paidContracts++;
      } else if (status === 'Debt' || status === 'Nợ phí') {
        debtAmount += amount;
        debtContracts++;
      }
      
      // Group by month
      const monthKey = `${createdAt.getMonth() + 1}/${contractYear}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: `Tháng ${createdAt.getMonth() + 1}`,
          year: contractYear,
          totalRevenue: 0,
          paidCount: 0,
          debtAmount: 0,
          debtCount: 0,
        });
      }
      const monthData = monthMap.get(monthKey)!;
      monthData.totalRevenue += amount;
      if (status === 'Paid' || status === 'Đã thanh toán') {
        monthData.paidCount++;
      } else if (status === 'Debt' || status === 'Nợ phí') {
        monthData.debtAmount += amount;
        monthData.debtCount++;
      }
      
      // Group by class
      const className = contract.className || 'Không xác định';
      const classId = contract.classId || className;
      if (!classMap.has(classId)) {
        classMap.set(classId, {
          classId,
          className,
          totalRevenue: 0,
          studentCount: 0,
        });
      }
      const classData = classMap.get(classId)!;
      classData.totalRevenue += amount;
      classData.studentCount++;
    });
    
    return {
      totalRevenue,
      paidRevenue,
      debtAmount,
      totalContracts: contracts.length,
      paidContracts,
      debtContracts,
      byMonth: Array.from(monthMap.values()).sort((a, b) => {
        const aMonth = parseInt(a.month.replace('Tháng ', ''));
        const bMonth = parseInt(b.month.replace('Tháng ', ''));
        return aMonth - bMonth;
      }),
      byClass: Array.from(classMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue),
    };
  } catch (error) {
    console.error('Error getting revenue summary:', error);
    throw new Error('Không thể tải báo cáo doanh thu');
  }
};
