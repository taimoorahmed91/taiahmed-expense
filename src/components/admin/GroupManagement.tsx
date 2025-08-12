import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
  member_count?: number;
}

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  joined_at: string;
}

export const GroupManagement = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const fetchGroups = async () => {
    try {
      // Direct query to groups table
      const { data: groupsData, error: groupsError } = await (supabase as any)
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group: any) => {
          const { data: membersData, error: membersError } = await (supabase as any)
            .from('group_members')
            .select('id')
            .eq('group_id', group.id);

          return {
            ...group,
            member_count: membersData?.length || 0
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_profile')
        .select('id, user_id, email, full_name')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      // Use raw query for group members
      const { data, error } = await (supabase as any)
        .from('group_members')
        .select(`
          id,
          user_id,
          joined_at,
          expense_profile!inner(full_name, email)
        `)
        .eq('group_id', groupId);

      if (error) throw error;

      const members = data?.map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        full_name: member.expense_profile?.full_name || 'Unknown',
        email: member.expense_profile?.email || '',
        joined_at: member.joined_at
      })) || [];

      setGroupMembers(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
      setGroupMembers([]);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await (supabase as any)
        .from('groups')
        .insert({
          name: newGroupName,
          description: newGroupDescription,
          created_by: user.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group created successfully",
      });

      setNewGroupName('');
      setNewGroupDescription('');
      setCreateGroupOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error", 
        description: "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const addMemberToGroup = async () => {
    if (!selectedGroup || !selectedUserId) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await (supabase as any)
        .from('group_members')
        .insert({
          group_id: selectedGroup.id,
          user_id: selectedUserId,
          added_by: user.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User added to group successfully",
      });

      setSelectedUserId('');
      setAddMemberOpen(false);
      fetchGroupMembers(selectedGroup.id);
      fetchGroups();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "Failed to add user to group",
        variant: "destructive",
      });
    }
  };

  const removeMemberFromGroup = async (memberId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User removed from group",
      });

      if (selectedGroup) {
        fetchGroupMembers(selectedGroup.id);
        fetchGroups();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove user from group",
        variant: "destructive",
      });
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group deleted successfully",
      });

      setSelectedGroup(null);
      setGroupMembers([]);
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  const availableUsers = users.filter(user => 
    !groupMembers.some(member => member.user_id === user.user_id)
  );

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
          <h2 className="text-2xl font-bold text-foreground">Group Management</h2>
          <p className="text-muted-foreground">Create and manage user groups for expense sharing</p>
        </div>
        
        <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new group to organize users for expense sharing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Group Name</label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Enter group description (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createGroup} disabled={!newGroupName.trim()}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Groups
            </CardTitle>
            <CardDescription>
              Manage expense sharing groups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groups.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No groups created yet</p>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedGroup?.id === group.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setSelectedGroup(group);
                    fetchGroupMembers(group.id);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-foreground">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                      )}
                      <Badge variant="secondary" className="mt-2">
                        {group.member_count} members
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this group?')) {
                          deleteGroup(group.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Group Members
              {selectedGroup && (
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Member to {selectedGroup.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.user_id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addMemberToGroup} disabled={!selectedUserId}>
                        Add Member
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
            <CardDescription>
              {selectedGroup ? `Members of ${selectedGroup.name}` : 'Select a group to view members'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedGroup ? (
              <p className="text-muted-foreground text-center py-8">Select a group to view its members</p>
            ) : groupMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No members in this group</p>
            ) : (
              <div className="space-y-2">
                {groupMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Remove ${member.full_name} from the group?`)) {
                          removeMemberFromGroup(member.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};