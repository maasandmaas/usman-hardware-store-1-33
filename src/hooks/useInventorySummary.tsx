
import { useState, useEffect } from 'react';
import { inventoryApi } from '@/services/api';

interface InventorySummary {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export function useInventorySummary() {
  const [summary, setSummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await inventoryApi.getAll({
        limit: 10000 // Get all products for accurate summary
      });
      
      if (response.success) {
        const inventoryData = response.data?.inventory || response.data || [];
        const inventoryArray = Array.isArray(inventoryData) ? inventoryData : [];
        
        if (response.data?.summary) {
          setSummary(response.data.summary);
        } else {
          // Calculate summary from inventory data
          const totalProducts = inventoryArray.length;
          const totalValue = inventoryArray.reduce((sum, item) => sum + (item.value || 0), 0);
          const lowStockItems = inventoryArray.filter(item => 
            (item.currentStock || 0) <= (item.minStock || 0) && (item.currentStock || 0) > 0
          ).length;
          const outOfStockItems = inventoryArray.filter(item => 
            (item.currentStock || 0) === 0
          ).length;
          
          setSummary({
            totalProducts,
            totalValue,
            lowStockItems,
            outOfStockItems
          });
        }
      } else {
        throw new Error('Failed to fetch inventory summary');
      }
    } catch (err) {
      console.error('Failed to fetch inventory summary:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  };
}
