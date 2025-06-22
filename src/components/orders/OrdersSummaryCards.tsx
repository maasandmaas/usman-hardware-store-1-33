
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Package, Calendar } from "lucide-react";

interface OrdersSummaryCardsProps {
  summary: {
    totalOrders: number;
    totalSales: number;
    avgOrderValue: number;
    todayOrders?: number;
    todayMargin?: number;
  };
}

export const OrdersSummaryCards = ({ summary }: OrdersSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalOrders}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">Rs. {summary.totalSales.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-purple-600">Rs. {summary.avgOrderValue.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Today's Orders</p>
              <p className="text-2xl font-bold text-orange-600">{summary.todayOrders || 0}</p>
              <p className="text-xs text-slate-500">Margin: Rs. {(summary.todayMargin || 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
