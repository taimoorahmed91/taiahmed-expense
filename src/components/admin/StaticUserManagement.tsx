import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, User, Trash2, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaticUser {
  id: string;
  username: string;
  created_at: string;
  is_active: boolean;
}

export const StaticUserManagement = () => {
  const [staticUsers, setStaticUsers] = useState<StaticUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchStaticUsers();
  }, []);

  const fetchStaticUsers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('static_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaticUsers(data || []);
    } catch (error) {
      console.error('Error fetching static users:', error);
      toast({
        title: "Error",
        description: "Failed to load static users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStaticUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_static_user', {
        username_param: newUsername,
        password_param: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Static user created successfully",
      });

      setNewUsername('');
      setNewPassword('');
      setCreateUserOpen(false);
      fetchStaticUsers();
    } catch (error) {
      console.error('Error creating static user:', error);
      toast({
        title: "Error",
        description: "Failed to create static user",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('static_users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      fetchStaticUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const deleteStaticUser = async (userId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('static_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Static user deleted successfully",
      });

      fetchStaticUsers();
    } catch (error) {
      console.error('Error deleting static user:', error);
      toast({
        title: "Error",
        description: "Failed to delete static user",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Static User Management</h2>
          <p className="text-muted-foreground">Create and manage static usernames for group access</p>
        </div>
        
        <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Create Static User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Static User</DialogTitle>
              <DialogDescription>
                Create a static username that can be assigned to groups
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Username</label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username (e.g., user1, teamlead)"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createStaticUser} disabled={!newUsername.trim() || !newPassword.trim()}>
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Static Users
          </CardTitle>
          <CardDescription>
            Manage static usernames for group assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staticUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No static users created yet</p>
          ) : (
            <div className="space-y-4">
              {staticUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                      <Key className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete static user "${user.username}"?`)) {
                          deleteStaticUser(user.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};