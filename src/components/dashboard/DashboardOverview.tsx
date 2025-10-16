import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { ExpenseTrendsChart } from './ExpenseTrendsChart';
import { ExpenseDistributionChart } from './ExpenseDistributionChart';
import { BudgetAlerts } from '@/components/budget/BudgetAlerts';
import { SevenDayExpenseTable } from './SevenDayExpenseTable';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Target,
  GripVertical
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

interface DashboardCard {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  className: string;
  iconColor: string;
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
  const [cardOrder, setCardOrder] = useState(['monthly', 'total', 'nonRental', 'average', 'topCategory']);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const dashboardCards: DashboardCard[] = [
    {
      id: 'monthly',
      title: 'This Month',
      value: `${stats.monthlyTotal.toFixed(2)} zł`,
      subtitle: `${stats.transactionCount} transactions`,
      icon: DollarSign,
      className: 'border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10',
      iconColor: 'text-primary'
    },
    {
      id: 'total',
      title: 'Total Expenses',
      value: `${stats.totalExpenses.toFixed(2)} zł`,
      subtitle: 'All time total',
      icon: TrendingUp,
      className: 'border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10',
      iconColor: 'text-secondary-foreground'
    },
    {
      id: 'nonRental',
      title: 'Non Rental Expenses',
      value: `${stats.monthlyNonRental.toFixed(2)} zł`,
      subtitle: 'This month excluding rental & utilities',
      icon: Calendar,
      className: 'border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10',
      iconColor: 'text-green-600'
    },
    {
      id: 'average',
      title: 'Average Expense',
      value: `${stats.averageExpense.toFixed(2)} zł`,
      subtitle: 'Per transaction',
      icon: ShoppingCart,
      className: 'border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10',
      iconColor: 'text-accent-foreground'
    },
    {
      id: 'topCategory',
      title: 'Top Category',
      value: stats.topCategory,
      subtitle: 'Most spent category',
      icon: Target,
      className: 'border-2 border-muted/20 bg-gradient-to-br from-muted/5 to-muted/10',
      iconColor: 'text-muted-foreground'
    }
  ];

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  };

  const orderedCards = cardOrder.map(id => dashboardCards.find(card => card.id === id)!).filter(Boolean);

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {orderedCards.map((card) => (
              <SortableCard key={card.id} card={card} />
            ))}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {activeId ? (
            <Card className={dashboardCards.find(c => c.id === activeId)?.className}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {dashboardCards.find(c => c.id === activeId)?.title}
                </CardTitle>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold opacity-50">Dragging...</div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <BudgetAlerts />
      
      <ExpenseTrendsChart />
      
      <ExpenseDistributionChart />
      
      <SevenDayExpenseTable />
    </div>
  );
};

function SortableCard({ card }: { card: DashboardCard }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = card.icon;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`${card.className} cursor-grab active:cursor-grabbing transition-all hover:shadow-lg`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
          <div className="flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${card.iconColor}`} />
            <div {...listeners} className="p-1 hover:bg-muted/50 rounded cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{card.value}</div>
          <p className="text-xs text-muted-foreground">
            {card.subtitle}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}