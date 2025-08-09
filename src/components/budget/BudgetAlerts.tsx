import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { AlertTriangle, CheckCircle, Clock, Target, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Budget {
  id: string;
  amount: number;
  period: string;
  category_id?: string;
  start_date: string;
  end_date: string;
  categoryName?: string;
}

interface BudgetAlert extends Budget {
  spent: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
  daysLeft: number;
}

interface SortableAlertCardProps {
  alert: BudgetAlert;
}

const SortableAlertCard = ({ alert }: SortableAlertCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: alert.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'danger': return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'exceeded': return 'bg-red-100 border-red-200 text-red-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <Clock className="h-4 w-4" />;
      case 'danger': return <AlertTriangle className="h-4 w-4" />;
      case 'exceeded': return <AlertTriangle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'safe': return 'On Track';
      case 'warning': return 'Watch Out';
      case 'danger': return 'Over Budget';
      case 'exceeded': return 'Exceeded';
      default: return 'Unknown';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`transition-all duration-200 hover:shadow-md ${getStatusColor(alert.status)}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1 hover:bg-black/10 rounded"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            {alert.categoryName || 'Overall Budget'}
            <Badge variant="outline" className="text-xs">
              {alert.period}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon(alert.status)}
            <Badge className={getStatusColor(alert.status)}>
              {getStatusText(alert.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Spent: {alert.spent.toFixed(2)} zł</span>
            <span>Budget: {alert.amount.toFixed(2)} zł</span>
          </div>
          <Progress 
            value={Math.min(alert.percentage, 100)} 
            className={`h-2 ${alert.percentage > 100 ? 'bg-red-200' : ''}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{alert.percentage.toFixed(1)}% used</span>
            <span>{alert.daysLeft} days left</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Period: {format(new Date(alert.start_date), 'dd/MM/yyyy')} - {format(new Date(alert.end_date), 'dd/MM/yyyy')}
        </div>
        {alert.percentage > 100 && (
          <div className="text-xs text-red-600 font-medium">
            Over budget by {(alert.spent - alert.amount).toFixed(2)} zł
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const BudgetAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) {
      fetchBudgetAlerts();
    }
  }, [user]);

  const calculateDaysLeft = (endDate: string): number => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAlertStatus = (percentage: number, daysLeft: number): BudgetAlert['status'] => {
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'danger';
    if (percentage >= 60) return 'warning';
    return 'safe';
  };

  const fetchBudgetAlerts = async () => {
    try {
      console.log('Fetching budget alerts for user:', user?.id);
      
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Fetch active budgets
      const { data: budgets, error: budgetError } = await supabase
        .from('expense_budgets')
        .select(`
          *,
          expense_categories (
            name
          )
        `)
        .eq('user_id', user?.id)
        .lte('start_date', currentDate)
        .gte('end_date', currentDate);

      if (budgetError) {
        console.error('Budget fetch error:', budgetError);
        throw budgetError;
      }

      console.log('Fetched budgets:', budgets);

      if (!budgets || budgets.length === 0) {
        console.log('No active budgets found');
        setAlerts([]);
        setLoading(false);
        return;
      }

      // Calculate spending for each budget
      const alertsPromises = budgets.map(async (budget) => {
        console.log('Processing budget:', budget);
        
        let query = supabase
          .from('expense_transactions')
          .select('amount')
          .eq('user_id', user?.id)
          .gte('transaction_date', budget.start_date)
          .lte('transaction_date', budget.end_date);

        // If budget is category-specific, filter by category
        if (budget.category_id) {
          query = query.eq('category_id', budget.category_id);
        }

        const { data: transactions, error: transactionError } = await query;

        if (transactionError) {
          console.error('Transaction fetch error for budget:', budget.id, transactionError);
          throw transactionError;
        }

        console.log('Transactions for budget', budget.id, ':', transactions);

        const spent = transactions?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const daysLeft = calculateDaysLeft(budget.end_date);
        const status = getAlertStatus(percentage, daysLeft);

        console.log('Budget calculation:', {
          budgetId: budget.id,
          spent,
          amount: budget.amount,
          percentage,
          daysLeft,
          status
        });

        return {
          ...budget,
          categoryName: budget.expense_categories?.name,
          spent,
          percentage,
          status,
          daysLeft
        } as BudgetAlert;
      });

      const calculatedAlerts = await Promise.all(alertsPromises);
      console.log('All calculated alerts:', calculatedAlerts);
      
      // Sort by status priority (exceeded > danger > warning > safe)
      const sortedAlerts = calculatedAlerts.sort((a, b) => {
        const statusOrder = { 'exceeded': 0, 'danger': 1, 'warning': 2, 'safe': 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      setAlerts(sortedAlerts);
    } catch (error) {
      console.error('Error fetching budget alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setAlerts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
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
            <Target className="h-5 w-5" />
            Budget Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active budgets found</p>
            <p className="text-sm text-muted-foreground">Create a budget in Settings to start tracking your spending</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Budget Alerts
          <Badge variant="outline">{alerts.length}</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag and drop to reorder alerts by priority
        </p>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={alerts.map(alert => alert.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <SortableAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};