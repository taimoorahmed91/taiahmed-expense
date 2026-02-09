import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { Receipt, MapPin, User, Users } from 'lucide-react';

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
    full_name: string;
    email: string;
  };
}

export const ExpenseList = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'personal' | 'group'>('personal');

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user, viewMode]);

  const fetchExpenses = async () => {
    try {
      let query = supabase
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
          )
        `)
        .order('transaction_date', { ascending: false })
        .limit(10);

      // If personal mode, only show user's own expenses
      if (viewMode === 'personal') {
        query = query.eq('user_id', user?.id);
      }
      // For group mode, the RLS policy will automatically handle showing 
      // user's own expenses + group member expenses

      const { data: expenseData, error } = await query;

      if (error) throw error;

      // Get user profiles for the expenses
      const userIds = expenseData?.map(expense => expense.user_id) || [];
      const { data: profileData } = await supabase
        .from('expense_profile')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profileData?.map(profile => [profile.user_id, profile]) || []);

      const formattedExpenses = expenseData?.map(expense => ({
        ...expense,
        category: expense.expense_categories as { name: string; color: string },
        expense_profile: profileMap.get(expense.user_id) || undefined
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-secondary/50">
              <Receipt className="w-5 h-5 text-secondary-foreground" />
            </div>
            Recent Expenses
          </CardTitle>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'personal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('personal')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Personal
            </Button>
            <Button
              variant={viewMode === 'group' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('group')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Group
            </Button>
          </div>
        </div>
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
                  {viewMode === 'group' && expense.user_id !== user?.id && (
                    <div className="text-xs text-muted-foreground/80 mt-1">
                      by {expense.expense_profile?.full_name || expense.expense_profile?.email || 'Unknown'}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-1">
                  {expense.category.name}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(expense.transaction_date + 'T00:00:00'), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};