import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { ExpenseTrendsChart } from './ExpenseTrendsChart';
import { ExpenseDistributionChart } from './ExpenseDistributionChart';
import { BudgetAlerts } from '@/components/budget/BudgetAlerts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Target
} from 'lucide-react';

interface DashboardStats {
  totalExpenses: number;
  monthlyTotal: number;
  monthlyNonRental: number;
  transactionCount: number;
  averageExpense: number;
  topCategory: string;
  monthlyBudget: number;
}

export const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    monthlyTotal: 0,
    monthlyNonRental: 0,
    transactionCount: 0,
    averageExpense: 0,
    topCategory: 'No expenses yet',
    monthlyBudget: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Get monthly expenses
      const { data: monthlyExpenses, error: monthlyError } = await supabase
        .from('expense_transactions')
        .select('amount, category_id, expense_categories(name)')
        .eq('user_id', user?.id)
        .gte('transaction_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);

      if (monthlyError) throw monthlyError;

      // Get total expenses
      const { data: totalExpenses, error: totalError } = await supabase
        .from('expense_transactions')
        .select('amount')
        .eq('user_id', user?.id);

      if (totalError) throw totalError;

      // Get monthly budget for current period
      const currentDate = new Date().toISOString().split('T')[0];
      const { data: budgetData, error: budgetError } = await supabase
        .from('expense_budgets')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('period', 'monthly')
        .lte('start_date', currentDate)
        .gte('end_date', currentDate)
        .order('created_at', { ascending: false })
        .limit(1);

      if (budgetError) throw budgetError;

      // Calculate stats
      const monthlyTotal = monthlyExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const monthlyNonRental = monthlyExpenses?.reduce((sum, exp) => {
        const categoryName = exp.expense_categories?.name?.toLowerCase() || '';
        if (categoryName.includes('rental') || categoryName.includes('rent') || categoryName.includes('utilities') || categoryName.includes('utility')) {
          return sum;
        }
        return sum + Number(exp.amount);
      }, 0) || 0;
      const totalAmount = totalExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const transactionCount = monthlyExpenses?.length || 0;
      const averageExpense = transactionCount > 0 ? monthlyTotal / transactionCount : 0;

      // Find top category
      const categoryTotals = monthlyExpenses?.reduce((acc, exp) => {
        const categoryName = exp.expense_categories?.name || 'Other';
        acc[categoryName] = (acc[categoryName] || 0) + Number(exp.amount);
        return acc;
      }, {} as Record<string, number>) || {};

      const topCategory = Object.keys(categoryTotals).length > 0 
        ? Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0][0]
        : 'No expenses yet';

      const monthlyBudget = budgetData?.[0]?.amount || 0;

      setStats({
        totalExpenses: totalAmount,
        monthlyTotal,
        monthlyNonRental,
        transactionCount,
        averageExpense,
        topCategory,
        monthlyBudget
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const budgetProgress = stats.monthlyBudget > 0 ? (stats.monthlyTotal / stats.monthlyBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyTotal.toFixed(2)} zł</div>
            <p className="text-xs text-muted-foreground">
              {stats.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <TrendingUp className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExpenses.toFixed(2)} zł</div>
            <p className="text-xs text-muted-foreground">
              All time total
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Non Rental Expenses</CardTitle>
            <Calendar className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyNonRental.toFixed(2)} zł</div>
            <p className="text-xs text-muted-foreground">
              This month excluding rental & utilities
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Expense</CardTitle>
            <ShoppingCart className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageExpense.toFixed(2)} zł</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-muted/20 bg-gradient-to-br from-muted/5 to-muted/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
            <Target className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.topCategory}</div>
            <p className="text-xs text-muted-foreground">
              Most spent category
            </p>
          </CardContent>
        </Card>
      </div>


      <BudgetAlerts />
      
      <ExpenseTrendsChart />
      
      <ExpenseDistributionChart />
    </div>
  );
};