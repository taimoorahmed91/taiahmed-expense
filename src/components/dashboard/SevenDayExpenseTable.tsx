import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { format, subDays } from 'date-fns';

interface DayExpense {
  [categoryName: string]: number;
}

interface SevenDayData {
  [date: string]: DayExpense;
}

export const SevenDayExpenseTable = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SevenDayData>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate last 7 days (today to 6 days ago)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i); // Reverse order: oldest to newest
    return format(date, 'yyyy-MM-dd');
  });

  useEffect(() => {
    if (user) {
      fetchSevenDayExpenses();
    }
  }, [user]);

  const fetchSevenDayExpenses = async () => {
    try {
      const oldestDate = last7Days[0];
      
      // Fetch all categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('name')
        .order('priority', { ascending: true });

      if (categoriesError) throw categoriesError;

      const categoryNames = categoriesData.map(cat => cat.name);
      setCategories(categoryNames);

      // Fetch expenses for last 7 days
      const { data: expenses, error } = await supabase
        .from('expense_transactions')
        .select('amount, transaction_date, expense_categories(name)')
        .eq('user_id', user?.id)
        .gte('transaction_date', oldestDate);

      if (error) throw error;

      // Process data into structure: { date: { category: amount } }
      const processedData: SevenDayData = {};
      
      // Initialize all dates with all categories set to 0
      last7Days.forEach(date => {
        processedData[date] = {};
        categoryNames.forEach(cat => {
          processedData[date][cat] = 0;
        });
      });

      // Fill in actual expense data
      expenses?.forEach(expense => {
        const date = expense.transaction_date;
        const categoryName = expense.expense_categories?.name || 'Other';
        if (processedData[date]) {
          processedData[date][categoryName] = (processedData[date][categoryName] || 0) + Number(expense.amount);
        }
      });

      setData(processedData);
    } catch (error) {
      console.error('Error fetching 7-day expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayTotal = (date: string) => {
    return Object.values(data[date] || {}).reduce((sum, amount) => sum + amount, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last 7 Days Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Category</TableHead>
              {last7Days.map(date => (
                <TableHead key={date} className="text-right">
                  {format(new Date(date), 'MMM dd')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(category => (
              <TableRow key={category}>
                <TableCell className="font-medium">{category}</TableCell>
                {last7Days.map(date => {
                  const amount = data[date]?.[category] || 0;
                  return (
                    <TableCell key={`${category}-${date}`} className="text-right">
                      {amount > 0 ? `${amount.toFixed(2)} zł` : '—'}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell className="font-bold">Total</TableCell>
              {last7Days.map(date => {
                const total = getDayTotal(date);
                return (
                  <TableCell key={`total-${date}`} className="text-right font-bold">
                    {total > 0 ? `${total.toFixed(2)} zł` : '—'}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
