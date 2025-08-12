import React from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { AccessDenied } from '@/components/admin/AccessDenied';

const AdminUsers = () => {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-card)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return <AdminTabs />;
};

export default AdminUsers;