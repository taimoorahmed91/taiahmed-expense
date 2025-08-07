import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { Receipt, MapPin } from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
  category: {
    name: string;
    color: string;
  };
}

export const ExpenseList = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_transactions')
        .select(`
          id,
          amount,
          description,
          transaction_date,
          created_at,
          expense_categories!inner (
            name,
            color
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedExpenses = data?.map(expense => ({
        ...expense,
        category: expense.expense_categories as { name: string; color: string }
      })) || [];

      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading expenses...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Recent Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No expenses yet. Add your first expense above!
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: expense.category.color }}
                />
                <div>
                  <div className="font-medium">${expense.amount.toFixed(2)}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {expense.description}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-1">
                  {expense.category.name}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};