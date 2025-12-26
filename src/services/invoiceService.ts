/**
 * Invoice Service
 * Handle book/product invoices CRUD
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const INVOICES_COLLECTION = 'invoices';

export type InvoiceStatus = 'Chờ thanh toán' | 'Đã thanh toán' | 'Đã hủy';

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id?: string;
  invoiceCode: string;
  customerName: string;
  customerPhone?: string;
  studentId?: string;
  studentName?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  paymentMethod?: string;
  note?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string;
}

const generateInvoiceCode = (): string => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV${dateStr}-${random}`;
};

export const createInvoice = async (data: Omit<Invoice, 'id' | 'invoiceCode'>): Promise<string> => {
  try {
    const invoiceData = {
      ...data,
      invoiceCode: generateInvoiceCode(),
      status: data.status || 'Chờ thanh toán',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, INVOICES_COLLECTION), invoiceData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Không thể tạo hóa đơn');
  }
};

export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const q = query(collection(db, INVOICES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Invoice));
  } catch (error) {
    console.error('Error getting invoices:', error);
    throw new Error('Không thể tải danh sách hóa đơn');
  }
};

export const updateInvoice = async (id: string, data: Partial<Invoice>): Promise<void> => {
  try {
    const docRef = doc(db, INVOICES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw new Error('Không thể cập nhật hóa đơn');
  }
};

export const markAsPaid = async (id: string): Promise<void> => {
  await updateInvoice(id, { 
    status: 'Đã thanh toán', 
    paidAt: new Date().toISOString() 
  });
};

export const cancelInvoice = async (id: string): Promise<void> => {
  await updateInvoice(id, { status: 'Đã hủy' });
};

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, INVOICES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw new Error('Không thể xóa hóa đơn');
  }
};
