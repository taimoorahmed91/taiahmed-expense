import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Calendar, TrendingUp, BarChart3 } from 'lucide-react';

interface CategoryData {
  category: string;
  amount: number;
  color: string;
}

export const AnalyticsOverview = () => {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<CategoryData[]>([]);
  const [weeklyData, setWeeklyData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      // Get categories
      const { data: categories, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('id, name, color')
        .order('priority', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Get date ranges
      const today = new Date().toISOString().split('T')[0];
      
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      // Fetch daily data (today)
      const { data: dailyExpenses, error: dailyError } = await supabase
        .from('expense_transactions')
        .select('amount, expense_categories(id, name, color)')
        .eq('user_id', user?.id)
        .eq('transaction_date', today);

      // Fetch weekly data (last 7 days)
      const { data: weeklyExpenses, error: weeklyError } = await supabase
        .from('expense_transactions')
        .select('amount, expense_categories(id, name, color)')
        .eq('user_id', user?.id)
        .gte('transaction_date', weekStartStr);

      // Fetch monthly data (last 30 days)
      const { data: monthlyExpenses, error: monthlyError } = await supabase
        .from('expense_transactions')
        .select('amount, expense_categories(id, name, color)')
        .eq('user_id', user?.id)
        .gte('transaction_date', monthStartStr);

      if (dailyError || weeklyError || monthlyError) {
        throw dailyError || weeklyError || monthlyError;
      }

      // Process data for each period
      const processData = (expenses: any[], allCategories: any[]): CategoryData[] => {
        const categoryTotals: { [key: string]: { amount: number; color: string } } = {};

        // Initialize all categories with 0
        allCategories.forEach(cat => {
          categoryTotals[cat.name] = { amount: 0, color: cat.color };
        });

        // Add actual expenses
        expenses?.forEach(expense => {
          const categoryName = expense.expense_categories?.name || 'Other';
          const amount = Number(expense.amount);
          const color = expense.expense_categories?.color || '#6B7280';
          
          if (categoryTotals[categoryName]) {
            categoryTotals[categoryName].amount += amount;
          } else {
            categoryTotals[categoryName] = { amount, color };
          }
        });

        return Object.entries(categoryTotals)
          .map(([category, { amount, color }]) => ({
            category: category.length > 12 ? category.substring(0, 12) + '...' : category,
            amount,
            color
          }))
          .filter(item => item.amount > 0)
          .sort((a, b) => b.amount - a.amount);
      };

      setDailyData(processData(dailyExpenses || [], categories || []));
      setWeeklyData(processData(weeklyExpenses || [], categories || []));
      setMonthlyData(processData(monthlyExpenses || [], categories || []));

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBarChart = (data: CategoryData[], title: string, icon: React.ReactNode, period: string) => {
    const chartConfig = data.reduce((config, item) => {
      config[item.category] = {
        label: item.category,
        color: item.color,
      };
      return config;
    }, {} as any);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="category"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value} zł`}
                  />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-muted-foreground">
                              {payload[0].value?.toLocaleString()} zł
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {period}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No expenses for {period.toLowerCase()}</p>
              </div>
            </div>
          )}
          
          {data.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium">Top Categories</h4>
              <div className="grid grid-cols-1 gap-2">
                {data.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.category}</span>
                    </div>
                    <span className="font-medium">{item.amount.toFixed(2)} zł</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-80 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {renderBarChart(dailyData, "Daily Analytics", <Calendar className="h-5 w-5" />, "Today")}
        {renderBarChart(weeklyData, "Weekly Analytics", <TrendingUp className="h-5 w-5" />, "Last 7 Days")}
        {renderBarChart(monthlyData, "Monthly Analytics", <BarChart3 className="h-5 w-5" />, "Last 30 Days")}
      </div>
    </div>
  );
};