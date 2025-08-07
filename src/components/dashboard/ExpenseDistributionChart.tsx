import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { PieChart as PieChartIcon } from 'lucide-react';

interface DistributionData {
  name: string;
  value: number;
  percentage: number;
  fill: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
];

export const ExpenseDistributionChart = () => {
  const { user } = useAuth();
  const [distributionData, setDistributionData] = useState<{
    daily: DistributionData[];
    weekly: DistributionData[];
    monthly: DistributionData[];
  }>({
    daily: [],
    weekly: [],
    monthly: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDistributionData();
    }
  }, [user]);

  const fetchDistributionData = async () => {
    try {
      const now = new Date();
      
      // Today
      const today = now.toISOString().split('T')[0];
      
      // This week (last 7 days)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      // This month (last 30 days)
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);

      // Fetch daily data
      const { data: dailyData, error: dailyError } = await supabase
        .from('expense_transactions')
        .select('amount, expense_categories(name, color)')
        .eq('user_id', user?.id)
        .eq('transaction_date', today);

      // Fetch weekly data
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('expense_transactions')
        .select('amount, expense_categories(name, color)')
        .eq('user_id', user?.id)
        .gte('transaction_date', weekStart.toISOString().split('T')[0]);

      // Fetch monthly data
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('expense_transactions')
        .select('amount, expense_categories(name, color)')
        .eq('user_id', user?.id)
        .gte('transaction_date', monthStart.toISOString().split('T')[0]);

      if (dailyError || weeklyError || monthlyError) {
        throw dailyError || weeklyError || monthlyError;
      }

      const processData = (data: any[]): DistributionData[] => {
        const categoryTotals: { [key: string]: { amount: number; color: string } } = {};
        let total = 0;

        data?.forEach(expense => {
          const categoryName = expense.expense_categories?.name || 'Other';
          const amount = Number(expense.amount);
          const color = expense.expense_categories?.color || '#6B7280';
          
          if (!categoryTotals[categoryName]) {
            categoryTotals[categoryName] = { amount: 0, color };
          }
          categoryTotals[categoryName].amount += amount;
          total += amount;
        });

        return Object.entries(categoryTotals)
          .map(([name, { amount, color }], index) => ({
            name,
            value: amount,
            percentage: total > 0 ? (amount / total) * 100 : 0,
            fill: color || COLORS[index % COLORS.length]
          }))
          .sort((a, b) => b.value - a.value);
      };

      setDistributionData({
        daily: processData(dailyData || []),
        weekly: processData(weeklyData || []),
        monthly: processData(monthlyData || [])
      });
    } catch (error) {
      console.error('Error fetching distribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPieChart = (data: DistributionData[], title: string) => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-center">{title}</h4>
      {data.length > 0 ? (
        <ChartContainer config={{}} className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DistributionData;
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value.toFixed(2)} zł ({data.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <div className="h-40 flex items-center justify-center text-muted-foreground">
          No expenses
        </div>
      )}
      <div className="space-y-1">
        {data.slice(0, 3).map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="truncate">{item.name}</span>
            </div>
            <span className="font-medium">{item.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Expense Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderPieChart(distributionData.daily, "Today")}
        {renderPieChart(distributionData.weekly, "Last 7 Days")}
        {renderPieChart(distributionData.monthly, "Last 30 Days")}
      </CardContent>
    </Card>
  );
};