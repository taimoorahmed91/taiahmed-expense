import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  PieChart,
  Calendar
} from 'lucide-react';

export const DashboardOverview = () => {
  // Mock data - in real app, this would come from Supabase
  const stats = {
    totalExpenses: 2847.50,
    monthlyBudget: 3500.00,
    transactions: 47,
    categories: 8
  };

  const budgetUsed = (stats.totalExpenses / stats.monthlyBudget) * 100;

  const recentTransactions = [
    { id: 1, description: 'Grocery Shopping', amount: 127.50, category: 'Food', date: '2024-01-07' },
    { id: 2, description: 'Coffee Shop', amount: 15.75, category: 'Food', date: '2024-01-07' },
    { id: 3, description: 'Gas Station', amount: 65.00, category: 'Transport', date: '2024-01-06' },
    { id: 4, description: 'Netflix Subscription', amount: 15.99, category: 'Entertainment', date: '2024-01-06' },
  ];

  const topCategories = [
    { name: 'Food & Dining', amount: 856.25, color: '#ef4444' },
    { name: 'Transportation', amount: 445.80, color: '#3b82f6' },
    { name: 'Entertainment', amount: 298.15, color: '#8b5cf6' },
    { name: 'Shopping', amount: 267.30, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/20" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${stats.totalExpenses.toFixed(2)}</div>
            <div className="flex items-center text-sm text-green-500 mt-1">
              <TrendingDown className="w-4 h-4 mr-1" />
              12% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/20" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Budget</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${stats.monthlyBudget.toFixed(2)}</div>
            <div className="flex items-center text-sm text-primary mt-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              {budgetUsed.toFixed(1)}% used
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/20" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.transactions}</div>
            <div className="flex items-center text-sm text-blue-500 mt-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              8 this week
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/20" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <PieChart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.categories}</div>
            <div className="flex items-center text-sm text-purple-500 mt-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              2 new this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card className="border-border/20" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
        <CardHeader>
          <CardTitle className="text-foreground">Monthly Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spent: ${stats.totalExpenses.toFixed(2)}</span>
              <span className="text-muted-foreground">Remaining: ${(stats.monthlyBudget - stats.totalExpenses).toFixed(2)}</span>
            </div>
            <Progress value={budgetUsed} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="border-border/20" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-border/20">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{transaction.category} • {transaction.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${transaction.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="border-border/20" style={{ background: 'var(--gradient-card)', boxShadow: 'var(--shadow-card)' }}>
          <CardHeader>
            <CardTitle className="text-foreground">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{category.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">${category.amount}</span>
                  </div>
                  <Progress 
                    value={(category.amount / stats.totalExpenses) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};