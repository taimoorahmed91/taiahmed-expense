import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Calendar, TrendingUp, BarChart3 } from 'lucide-react';

interface TrendPoint {
  date: string;
  amount: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
  priority: number;
}

export const AnalyticsOverview = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<{
    [categoryId: string]: {
      daily: TrendPoint[];
      weekly: TrendPoint[];
      monthly: TrendPoint[];
    }
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      // Get categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('id, name, color, priority')
        .order('priority', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Get last 3 months of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const { data: expenses, error } = await supabase
        .from('expense_transactions')
        .select('amount, transaction_date, category_id')
        .eq('user_id', user?.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      // Process trends for each category
      const trends: any = {};
      
      (categoriesData || []).forEach(category => {
        const categoryExpenses = expenses?.filter(exp => exp.category_id === category.id) || [];
        
        trends[category.id] = {
          daily: processDailyTrends(categoryExpenses),
          weekly: processWeeklyTrends(categoryExpenses),
          monthly: processMonthlyTrends(categoryExpenses)
        };
      });

      setCategoryTrends(trends);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDailyTrends = (expenses: any[]): TrendPoint[] => {
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayExpenses = expenses.filter(exp => exp.transaction_date === dateStr);
      const amount = dayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount
      });
    }
    return trends;
  };

  const processWeeklyTrends = (expenses: any[]): TrendPoint[] => {
    const trends = [];
    for (let i = 11; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * 7));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);

      const weekExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.transaction_date);
        return expDate >= startDate && expDate <= endDate;
      });
      const amount = weekExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

      trends.push({
        date: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        amount
      });
    }
    return trends;
  };

  const processMonthlyTrends = (expenses: any[]): TrendPoint[] => {
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.transaction_date);
        return expDate >= startOfMonth && expDate <= endOfMonth;
      });
      const amount = monthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount
      });
    }
    return trends;
  };

  const renderCategoryChart = (category: Category, period: 'daily' | 'weekly' | 'monthly', icon: React.ReactNode) => {
    const data = categoryTrends[category.id]?.[period] || [];
    const maxAmount = Math.max(...data.map(d => d.amount), 0);
    
    const periodLabels = {
      daily: 'Daily Trend (30 Days)',
      weekly: 'Weekly Trend (12 Weeks)', 
      monthly: 'Monthly Trend (6 Months)'
    };

    const chartConfig = {
      amount: {
        label: "Amount",
        color: category.color,
      },
    };

    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            {icon}
            <span className="truncate">{category.name}</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">{periodLabels[period]}</p>
        </CardHeader>
        <CardContent className="pt-2">
          {maxAmount > 0 ? (
            <ChartContainer config={chartConfig} className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value} zł`}
                    width={35}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`${value.toFixed(2)} zł`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke={category.color}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-xs">No expenses</p>
              </div>
            </div>
          )}
          {maxAmount > 0 && (
            <div className="mt-2 text-center">
              <p className="text-xs font-medium">Total: {data.reduce((sum, d) => sum + d.amount, 0).toFixed(2)} zł</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Category Analytics</h2>
          <p className="text-muted-foreground">Loading detailed trends for each category...</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[...Array(27)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-32 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Category Analytics</h2>
        <p className="text-muted-foreground">Detailed trends for each expense category</p>
      </div>
      
      {categories.map(category => (
        <div key={category.id} className="space-y-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-sm" 
              style={{ backgroundColor: category.color }}
            />
            <h3 className="text-lg font-semibold">{category.name}</h3>
          </div>
          
          <div className="grid gap-4 lg:grid-cols-3">
            {renderCategoryChart(category, 'daily', <Calendar className="h-4 w-4" />)}
            {renderCategoryChart(category, 'weekly', <TrendingUp className="h-4 w-4" />)}
            {renderCategoryChart(category, 'monthly', <BarChart3 className="h-4 w-4" />)}
          </div>
        </div>
      ))}
    </div>
  );
};