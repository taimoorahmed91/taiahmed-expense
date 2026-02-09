import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { LoginPage } from '@/components/auth/LoginPage';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { CorrectionList } from '@/components/corrections/CorrectionList';
import { ImportExport } from '@/components/import-export/ImportExport';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { SettingsOverview } from '@/components/settings/SettingsOverview';

const Index = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading || adminLoading) {
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

  // Only block access if user is not admin AND trying to access admin features
  // For now, we'll allow all authenticated users to access expense features
  // Admin-specific features should be handled in individual components

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
      case 'correction':
        return <CorrectionList />;
      case 'import-export':
        return <ImportExport />;
      case 'analytics':
        return <AnalyticsOverview />;
      case 'settings':
        return <SettingsOverview />;
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
