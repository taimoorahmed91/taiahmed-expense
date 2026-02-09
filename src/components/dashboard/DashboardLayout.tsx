import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  CreditCard, 
  PieChart, 
  Settings, 
  LogOut,
  Menu,
  X,
  TrendingUp,
  Users,
  Edit3,
  ArrowLeftRight
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: CreditCard },
    { id: 'correction', label: 'Data', icon: Edit3 },
    { id: 'import-export', label: 'Import/Export', icon: ArrowLeftRight },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--gradient-card)' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: 'var(--gradient-card)' }}>
        <div className="flex h-full flex-col border-r border-border/20">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: 'var(--gradient-primary)' }}>
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">ExpenseTracker</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start h-12 text-left"
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  style={activeTab === item.id ? { 
                    background: 'var(--gradient-primary)',
                    boxShadow: 'var(--shadow-elegant)'
                  } : {}}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              );
            })}
            
            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">
                    Admin
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-left"
                  onClick={() => {
                    navigate('/admin/users');
                    setSidebarOpen(false);
                  }}
                >
                  <Users className="w-5 h-5 mr-3" />
                  User Management
                </Button>
              </>
            )}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-border/20">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-border/20"
                style={{ background: 'var(--gradient-card)' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="text-xl font-semibold text-foreground capitalize">
            {activeTab}
          </div>
          <div className="w-8" /> {/* Spacer for centering */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};