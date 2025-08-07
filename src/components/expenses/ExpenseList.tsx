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
  user_id: string;
  category: {
    name: string;
    color: string;
  };
  expense_profile?: {
    email: string | null;
    full_name: string | null;
  } | null;
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
          user_id,
          expense_categories (
            name,
            color
          ),
          expense_profile (
            email,
            full_name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedExpenses = data?.map((expense: any) => ({
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
    <Card className="border-2 border-muted/50 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-secondary/50">
            <Receipt className="w-5 h-5 text-secondary-foreground" />
          </div>
          Recent Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No expenses yet</p>
            <p className="text-sm">Add your first expense to get started!</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-5 border-2 rounded-xl bg-gradient-to-r from-card to-card/90 hover:shadow-md transition-all duration-200 border-muted/30 hover:border-primary/30">
              <div className="flex items-center gap-3">
                <div 
                  className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm" 
                  style={{ backgroundColor: expense.category.color }}
                />
                <div>
                  <div className="font-semibold text-lg">{expense.amount.toFixed(2)} zł</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
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
                  <br />
                  Added by {expense.user_id === user?.id ? 'You' : (expense.expense_profile?.full_name || expense.expense_profile?.email || 'Unknown')}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};