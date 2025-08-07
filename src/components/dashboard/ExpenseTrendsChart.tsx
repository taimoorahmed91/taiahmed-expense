import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Calendar, TrendingUp, BarChart3 } from 'lucide-react';

interface CategoryTrendData {
  [key: string]: any;
  date: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  '#8B5CF6',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#6366F1'
];

export const ExpenseTrendsChart = () => {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<CategoryTrendData[]>([]);
  const [weeklyData, setWeeklyData] = useState<CategoryTrendData[]>([]);
  const [monthlyData, setMonthlyData] = useState<CategoryTrendData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrendData();
    }
  }, [user]);

  const fetchTrendData = async () => {
    try {
      // Get categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('id, name, color')
        .order('priority', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Get last 30 days of data with categories
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data: expenses, error } = await supabase
        .from('expense_transactions')
        .select('amount, transaction_date, expense_categories(id, name, color)')
        .eq('user_id', user?.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      // Process daily data
      const dailyTrends = processDailyData(expenses || [], categoriesData || []);
      setDailyData(dailyTrends);

      // Process weekly data  
      const weeklyTrends = processWeeklyData(expenses || [], categoriesData || []);
      setWeeklyData(weeklyTrends);

      // Process monthly data
      const monthlyTrends = processMonthlyData(expenses || [], categoriesData || []);
      setMonthlyData(monthlyTrends);

    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDailyData = (expenses: any[], categories: Category[]) => {
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData: CategoryTrendData = {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      categories.forEach(category => {
        const dayExpenses = expenses.filter(exp => 
          exp.transaction_date === dateStr && 
          exp.expense_categories?.id === category.id
        );
        dayData[category.name] = dayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      });

      last14Days.push(dayData);
    }
    return last14Days;
  };

  const processWeeklyData = (expenses: any[], categories: Category[]) => {
    const last8Weeks = [];
    for (let i = 7; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * 7));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);

      const weekData: CategoryTrendData = {
        date: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      };

      categories.forEach(category => {
        const weekExpenses = expenses.filter(exp => {
          const expDate = new Date(exp.transaction_date);
          return expDate >= startDate && expDate <= endDate && 
                 exp.expense_categories?.id === category.id;
        });
        weekData[category.name] = weekExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      });

      last8Weeks.push(weekData);
    }
    return last8Weeks;
  };

  const processMonthlyData = (expenses: any[], categories: Category[]) => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthData: CategoryTrendData = {
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };

      categories.forEach(category => {
        const monthExpenses = expenses.filter(exp => {
          const expDate = new Date(exp.transaction_date);
          return expDate >= startOfMonth && expDate <= endOfMonth && 
                 exp.expense_categories?.id === category.id;
        });
        monthData[category.name] = monthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      });

      last6Months.push(monthData);
    }
    return last6Months;
  };

  const renderChart = (data: CategoryTrendData[], title: string, icon: React.ReactNode) => {
    const chartConfig = categories.reduce((config, category, index) => {
      config[category.name] = {
        label: category.name,
        color: category.color || COLORS[index % COLORS.length],
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
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value} zł`}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [`${value.toFixed(2)} zł`]}
                />
                {categories.map((category, index) => (
                  <Line
                    key={category.id}
                    type="monotone"
                    dataKey={category.name}
                    stroke={category.color || COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-64 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {renderChart(dailyData, "Daily Trends (Last 14 Days)", <Calendar className="h-5 w-5" />)}
      {renderChart(weeklyData, "Weekly Trends (Last 8 Weeks)", <TrendingUp className="h-5 w-5" />)}
      {renderChart(monthlyData, "Monthly Trends (Last 6 Months)", <BarChart3 className="h-5 w-5" />)}
    </div>
  );
};