import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Mail, Calendar, Crown, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExpenseProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
}

export const AdminUsersList = () => {
  const [users, setUsers] = useState<ExpenseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_profile')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Check your admin permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleAdminStatus = async (userId: string, currentAdminStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('toggle_admin_status', {
        target_user_id: userId,
        new_admin_status: !currentAdminStatus
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `User ${!currentAdminStatus ? 'promoted to' : 'demoted from'} admin successfully.`,
      });

      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast({
        title: "Error",
        description: "Failed to update admin status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all users who have signed up</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/20" style={{ background: 'var(--gradient-card)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/20" style={{ background: 'var(--gradient-card)' }}>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Complete list of users who have signed up via Google OAuth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-border/20" style={{ background: 'var(--gradient-card)' }}>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.full_name?.split(' ').map(n => n[0]).join('') || user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{user.full_name || 'No name provided'}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {user.is_admin && (
                      <Badge variant="secondary" className="mb-2">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Joined {formatDate(user.created_at)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {user.is_admin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAdminStatus(user.user_id, user.is_admin)}
                        className="text-xs"
                      >
                        <UserMinus className="h-3 w-3 mr-1" />
                        Demote
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => toggleAdminStatus(user.user_id, user.is_admin)}
                        className="text-xs"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        Promote
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};