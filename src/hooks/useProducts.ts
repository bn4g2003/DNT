/**
 * useProducts Hook - Realtime listener
 */

import { useState, useEffect } from 'react';
import * as productService from '../services/productService';
import { Product, ProductStatus, ProductCategory } from '../services/productService';

interface UseProductsProps {
  status?: ProductStatus;
  category?: ProductCategory;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  createProduct: (data: Omit<Product, 'id'>) => Promise<string>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  updateStock: (id: string, quantity: number, type: 'add' | 'subtract') => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProducts = (props?: UseProductsProps): UseProductsReturn => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = productService.subscribeToProducts(
      (data) => {
        let filtered = data;
        if (props?.status) {
          filtered = filtered.filter(p => p.status === props.status);
        }
        if (props?.category) {
          filtered = filtered.filter(p => p.category === props.category);
        }
        setAllProducts(filtered);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Không thể tải danh sách sản phẩm');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [props?.status, props?.category]);

  const createProduct = async (data: Omit<Product, 'id'>): Promise<string> => {
    return await productService.createProduct(data);
  };

  const updateProduct = async (id: string, data: Partial<Product>): Promise<void> => {
    await productService.updateProduct(id, data);
  };

  const updateStock = async (id: string, quantity: number, type: 'add' | 'subtract'): Promise<void> => {
    await productService.updateStock(id, quantity, type);
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await productService.deleteProduct(id);
  };

  return {
    products: allProducts,
    loading,
    error,
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct,
  };
};
