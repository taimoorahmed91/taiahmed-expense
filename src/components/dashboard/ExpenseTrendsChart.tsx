import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { TrendingUp } from 'lucide-react';

interface TrendData {
  date: string;
  daily: number;
  weekly: number;
  monthly: number;
}

const chartConfig = {
  daily: {
    label: "Daily",
    color: "hsl(var(--primary))",
  },
  weekly: {
    label: "Weekly", 
    color: "hsl(var(--secondary))",
  },
  monthly: {
    label: "Monthly",
    color: "hsl(var(--accent))",
  },
};

export const ExpenseTrendsChart = () => {
  const { user } = useAuth();
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrendData();
    }
  }, [user]);

  const fetchTrendData = async () => {
    try {
      // Get last 30 days of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data: expenses, error } = await supabase
        .from('expense_transactions')
        .select('amount, transaction_date')
        .eq('user_id', user?.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      const groupedData: { [key: string]: number } = {};
      expenses?.forEach(expense => {
        const date = expense.transaction_date;
        groupedData[date] = (groupedData[date] || 0) + Number(expense.amount);
      });

      // Generate trend data for last 30 days
      const trends: TrendData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Daily amount
        const daily = groupedData[dateStr] || 0;
        
        // Weekly amount (sum of last 7 days including this day)
        let weekly = 0;
        for (let j = 0; j < 7; j++) {
          const weekDate = new Date(date);
          weekDate.setDate(weekDate.getDate() - j);
          const weekDateStr = weekDate.toISOString().split('T')[0];
          weekly += groupedData[weekDateStr] || 0;
        }
        
        // Monthly amount (sum of last 30 days including this day)
        let monthly = 0;
        for (let j = 0; j < 30; j++) {
          const monthDate = new Date(date);
          monthDate.setDate(monthDate.getDate() - j);
          const monthDateStr = monthDate.toISOString().split('T')[0];
          monthly += groupedData[monthDateStr] || 0;
        }

        trends.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          daily,
          weekly,
          monthly
        });
      }

      setTrendData(trends);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardContent className="p-6">
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Expense Trends (Daily, Weekly, Monthly)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value} zł`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`${value.toFixed(2)} zł`]}
              />
              <Line
                type="monotone"
                dataKey="daily"
                stroke="var(--color-daily)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="weekly"
                stroke="var(--color-weekly)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="monthly"
                stroke="var(--color-monthly)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};