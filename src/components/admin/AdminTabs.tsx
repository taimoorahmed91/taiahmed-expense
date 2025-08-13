import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUsersList } from './AdminUsersList';
import { GroupManagement } from './GroupManagement';
import { StaticUserManagement } from './StaticUserManagement';
import { Users, UserCog, Key } from 'lucide-react';

export const AdminTabs = () => {
  return (
    <div className="p-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            Group Management
          </TabsTrigger>
          <TabsTrigger value="static-users" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Static Users
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <AdminUsersList />
        </TabsContent>
        
        <TabsContent value="groups" className="mt-6">
          <GroupManagement />
        </TabsContent>
        
        <TabsContent value="static-users" className="mt-6">
          <StaticUserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};