import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Calendar } from 'lucide-react';

interface BudgetData {
  category: string;
  budget: number;
  actual: number;
  percentage: number;
  variance: number;
  color: string;
}

export const BudgetVsActual = () => {
  const { user } = useAuth();
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBudgetVsActual();
    }
  }, [user, selectedPeriod]);

  const fetchBudgetVsActual = async () => {
    try {
      const currentDate = new Date();
      let startDate: Date;
      let endDate: Date;

      // Calculate date range based on selected period
      switch (selectedPeriod) {
        case 'weekly':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          endDate = new Date();
          break;
        case 'yearly':
          startDate = new Date(currentDate.getFullYear(), 0, 1);
          endDate = new Date(currentDate.getFullYear(), 11, 31);
          break;
        default: // monthly
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      }

      // Get active budgets for the selected period
      const { data: budgets, error: budgetError } = await supabase
        .from('expense_budgets')
        .select(`
          id,
          amount,
          category_id,
          expense_categories(name, color)
        `)
        .eq('user_id', user?.id)
        .eq('period', selectedPeriod)
        .lte('start_date', endDate.toISOString().split('T')[0])
        .gte('end_date', startDate.toISOString().split('T')[0]);

      if (budgetError) throw budgetError;

      const budgetComparisons: BudgetData[] = [];

      for (const budget of budgets || []) {
        // Get actual spending for this category and period
        let spendingQuery = supabase
          .from('expense_transactions')
          .select('amount')
          .eq('user_id', user?.id)
          .gte('transaction_date', startDate.toISOString().split('T')[0])
          .lte('transaction_date', endDate.toISOString().split('T')[0]);

        // Filter by category if it's not "all categories"
        if (budget.category_id) {
          spendingQuery = spendingQuery.eq('category_id', budget.category_id);
        }

        const { data: spending, error: spendingError } = await spendingQuery;
        
        if (spendingError) throw spendingError;

        const actualSpending = spending?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
        const percentage = budget.amount > 0 ? (actualSpending / budget.amount) * 100 : 0;
        const variance = actualSpending - budget.amount;

        budgetComparisons.push({
          category: budget.expense_categories?.name || 'All Categories',
          budget: budget.amount,
          actual: actualSpending,
          percentage,
          variance,
          color: budget.expense_categories?.color || '#6B7280'
        });
      }

      // Sort by budget amount (highest first)
      budgetComparisons.sort((a, b) => b.budget - a.budget);

      setBudgetData(budgetComparisons);
    } catch (error) {
      console.error('Error fetching budget vs actual data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    budget: {
      label: "Budget",
      color: "hsl(var(--primary))",
    },
    actual: {
      label: "Actual",
      color: "hsl(var(--secondary))",
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Budget vs Actual Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Budget vs Actual Comparison
        </CardTitle>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {budgetData.length > 0 ? (
          <div className="space-y-4">
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value} zł`}
                  />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = budgetData.find(d => d.category === label);
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <div className="space-y-1 text-sm">
                              <p className="text-primary">Budget: {Number(payload[0]?.value || 0).toFixed(2)} zł</p>
                              <p className="text-secondary">Actual: {Number(payload[1]?.value || 0).toFixed(2)} zł</p>
                              {data && (
                                <>
                                  <p className={`font-medium ${data.variance > 0 ? 'text-destructive' : 'text-success'}`}>
                                    Variance: {data.variance > 0 ? '+' : ''}{data.variance.toFixed(2)} zł
                                  </p>
                                  <p className="text-muted-foreground">
                                    {data.percentage.toFixed(1)}% of budget used
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="budget" 
                    fill={chartConfig.budget.color}
                    name="Budget"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="actual" 
                    fill={chartConfig.actual.color}
                    name="Actual"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Summary</h4>
              {budgetData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-medium ${item.variance > 0 ? 'text-destructive' : 'text-success'}`}>
                      {item.variance > 0 ? '+' : ''}{item.variance.toFixed(2)} zł
                    </span>
                    <span className="text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>No budget data available for {selectedPeriod} period</p>
              <p className="text-xs mt-1">Set up budgets in Settings to see comparisons</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};