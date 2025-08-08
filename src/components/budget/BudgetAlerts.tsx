import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { AlertTriangle, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface BudgetAlert {
  id: string;
  categoryName: string;
  categoryColor: string;
  period: string;
  budgetAmount: number;
  currentSpending: number;
  percentage: number;
  status: 'good' | 'warning' | 'exceeded';
  endDate: string;
  startDate: string;
}

export const BudgetAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBudgetAlerts();
    }
  }, [user]);

  const fetchBudgetAlerts = async () => {
    try {
      // Get all budgets for user
      const { data: budgets, error: budgetError } = await supabase
        .from('expense_budgets')
        .select(`
          id,
          amount,
          period,
          start_date,
          end_date,
          category_id,
          expense_categories(name, color)
        `)
        .eq('user_id', user?.id);

      if (budgetError) throw budgetError;

      const currentDate = new Date();
      const budgetAlerts: BudgetAlert[] = [];

      for (const budget of budgets || []) {
        // Check if budget is currently active
        const startDate = new Date(budget.start_date);
        const endDate = new Date(budget.end_date);
        
        if (currentDate >= startDate && currentDate <= endDate) {
          // Get spending for this period and category
          let spendingQuery = supabase
            .from('expense_transactions')
            .select('amount, transaction_date')
            .eq('user_id', user?.id)
            .gte('transaction_date', budget.start_date)
            .lte('transaction_date', budget.end_date);

          // Filter by category if it's not "all categories"
          if (budget.category_id) {
            spendingQuery = spendingQuery.eq('category_id', budget.category_id);
          }

          const { data: spending, error: spendingError } = await spendingQuery;
          
          if (spendingError) throw spendingError;

          const currentSpending = spending?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
          const percentage = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;

          let status: 'good' | 'warning' | 'exceeded' = 'good';
          if (percentage >= 100) status = 'exceeded';
          else if (percentage >= 80) status = 'warning';

          budgetAlerts.push({
            id: budget.id,
            categoryName: budget.expense_categories?.name || 'All Categories',
            categoryColor: budget.expense_categories?.color || '#6B7280',
            period: budget.period,
            budgetAmount: budget.amount,
            currentSpending,
            percentage,
            status,
            endDate: budget.end_date,
            startDate: budget.start_date
          });
        }
      }

      // Sort by status priority (exceeded first, then warning, then good)
      budgetAlerts.sort((a, b) => {
        const statusOrder = { exceeded: 0, warning: 1, good: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      setAlerts(budgetAlerts);
    } catch (error) {
      console.error('Error fetching budget alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'Budget Exceeded';
      case 'warning':
        return 'Budget Warning';
      default:
        return 'On Track';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'bg-destructive';
      case 'warning':
        return 'bg-warning';
      default:
        return 'bg-primary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No active budgets found. Set up budgets in Settings to track your spending.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Budget Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <Alert 
            key={alert.id} 
            className={`border-l-4 ${
              alert.status === 'exceeded' 
                ? 'border-l-destructive bg-destructive/5' 
                : alert.status === 'warning'
                ? 'border-l-warning bg-warning/5'
                : 'border-l-success bg-success/5'
            }`}
          >
            <div className="flex items-start justify-between w-full">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(alert.status)}
                  <AlertTitle className="text-sm">
                    {alert.categoryName} - {getStatusText(alert.status)}
                  </AlertTitle>
                  <Badge variant="outline" className="text-xs">
                    {alert.period}
                  </Badge>
                </div>
                <AlertDescription className="text-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span>
                      {alert.currentSpending.toFixed(2)} zł of {alert.budgetAmount.toFixed(2)} zł
                    </span>
                    <span className="font-semibold">
                      {alert.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(alert.percentage, 100)} 
                    className={`h-2 ${getProgressBarColor(alert.status)}`}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Period: {format(new Date(alert.startDate), 'dd/MM/yyyy')} - {format(new Date(alert.endDate), 'dd/MM/yyyy')}
                  </p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};