import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoginPage } from '@/components/auth/LoginPage';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExpenseList } from '@/components/expenses/ExpenseList';

const Index = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{ background: 'var(--gradient-card)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Expenses Management</h2>
              <p className="text-muted-foreground">Track your daily expenses</p>
            </div>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              <ExpenseForm />
              <ExpenseList />
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Analytics & Reports</h2>
            <p className="text-muted-foreground">Coming soon - Detailed analytics and insights</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Settings</h2>
            <p className="text-muted-foreground">Coming soon - Customize your preferences</p>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTabContent()}
    </DashboardLayout>
  );
};

export default Index;
