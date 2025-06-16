
import { useToast } from '@/hooks/use-toast';
import { financeApi } from '@/services/financeApi';

export const useCustomerBalance = () => {
  const { toast } = useToast();

  const updateBalanceForOrderStatusChange = async (
    orderId: number,
    customerId: number,
    orderNumber: string,
    orderTotal: number,
    newStatus: string,
    previousStatus: string
  ) => {
    try {
      console.log('Updating customer balance for order status change:', {
        orderId,
        customerId,
        orderNumber,
        orderTotal,
        newStatus,
        previousStatus
      });

      // Determine if we need to add or remove debt based on status change
      let balanceUpdate = null;

      // If changing TO credit status (customer now owes money)
      if (newStatus === 'credit' && previousStatus !== 'credit') {
        balanceUpdate = {
          customerId,
          orderId,
          amount: orderTotal,
          type: 'credit' as const,
          orderNumber,
          description: `Order ${orderNumber} changed to credit - customer owes amount`
        };
      }
      // If changing FROM credit status (customer no longer owes money)
      else if (previousStatus === 'credit' && newStatus !== 'credit') {
        balanceUpdate = {
          customerId,
          orderId,
          amount: orderTotal,
          type: 'debit' as const,
          orderNumber,
          description: `Order ${orderNumber} status changed from credit - debt cleared`
        };
      }

      if (balanceUpdate) {
        const response = await financeApi.updateCustomerBalance(balanceUpdate);
        
        if (response.success) {
          console.log('Customer balance updated successfully:', response.data);
          toast({
            title: "Balance Updated",
            description: `Customer balance updated for order ${orderNumber}`,
          });
          return response.data;
        } else {
          throw new Error('Failed to update customer balance');
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to update customer balance:', error);
      toast({
        title: "Balance Update Failed",
        description: `Failed to update customer balance for order ${orderNumber}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const getCustomerBalance = async (customerId: number) => {
    try {
      const response = await financeApi.getCustomerBalance(customerId);
      if (response.success) {
        return response.data;
      } else {
        throw new Error('Failed to fetch customer balance');
      }
    } catch (error) {
      console.error('Failed to fetch customer balance:', error);
      throw error;
    }
  };

  const syncAllCustomerBalances = async () => {
    try {
      console.log('Starting customer balance sync with tax-free calculations...');
      const response = await financeApi.syncCustomerBalances();
      if (response.success) {
        toast({
          title: "Balances Synced",
          description: `Updated ${response.data.updated} customer balances without tax`,
        });
        return response.data;
      } else {
        throw new Error('Failed to sync customer balances');
      }
    } catch (error) {
      console.error('Failed to sync customer balances:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync customer balances",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    updateBalanceForOrderStatusChange,
    getCustomerBalance,
    syncAllCustomerBalances
  };
};
