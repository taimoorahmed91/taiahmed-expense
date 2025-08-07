import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Target, 
  Tag, 
  Bell, 
  Download, 
  Palette, 
  Shield,
  DollarSign,
  Save,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface Profile {
  full_name: string;
  email: string;
  avatar_url: string;
}

interface Budget {
  id: string;
  amount: number;
  period: string;
  category_id?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  priority: number;
}

export const SettingsOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ full_name: '', email: '', avatar_url: '' });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    weeklyReports: false,
    monthlyReports: true,
    expenseReminders: true
  });
  
  const [preferences, setPreferences] = useState({
    currency: 'zł',
    dateFormat: 'DD/MM/YYYY',
    theme: 'system',
    language: 'en'
  });

  const [newBudget, setNewBudget] = useState({ amount: '', period: 'monthly', category_id: '' });
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6', icon: 'DollarSign' });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data for user:', user?.id);
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('expense_profile')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      console.log('Profile data:', profileData, 'Profile error:', profileError);

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          avatar_url: profileData.avatar_url || ''
        });
      }

      // Fetch budgets with error handling
      const { data: budgetData, error: budgetError } = await supabase
        .from('expense_budgets')
        .select('*')
        .eq('user_id', user?.id);

      console.log('Budget data:', budgetData, 'Budget error:', budgetError);

      if (budgetError) {
        console.error('Budget fetch error:', budgetError);
        // Don't throw, just log and continue
      } else {
        setBudgets(budgetData || []);
      }

      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('expense_categories')
        .select('*')
        .order('priority', { ascending: true });

      console.log('Category data:', categoryData, 'Category error:', categoryError);

      if (categoryError) {
        console.error('Category fetch error:', categoryError);
      } else {
        setCategories(categoryData || []);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load settings data. Some features may not work properly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('expense_profile')
        .update({
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addBudget = async () => {
    if (!newBudget.amount) {
      toast({
        title: "Error",
        description: "Please enter a budget amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Adding budget:', newBudget);
      
      const { data, error } = await supabase
        .from('expense_budgets')
        .insert({
          user_id: user?.id,
          amount: parseFloat(newBudget.amount),
          period: newBudget.period,
          category_id: newBudget.category_id || null,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
        })
        .select()
        .single();

      console.log('Budget insert result:', data, error);

      if (error) {
        console.error('Budget insert error:', error);
        throw error;
      }

      setBudgets([...budgets, data]);
      setNewBudget({ amount: '', period: 'monthly', category_id: '' });

      toast({
        title: "Budget added",
        description: "New budget has been created successfully.",
      });
    } catch (error) {
      console.error('Error adding budget:', error);
      toast({
        title: "Error",
        description: `Failed to add budget: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteBudget = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from('expense_budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;

      setBudgets(budgets.filter(b => b.id !== budgetId));

      toast({
        title: "Budget deleted",
        description: "Budget has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportData = async () => {
    try {
      const { data: expenses } = await supabase
        .from('expense_transactions')
        .select('*, expense_categories(*)')
        .eq('user_id', user?.id);

      const csvContent = [
        ['Date', 'Amount', 'Category', 'Description'],
        ...(expenses || []).map(exp => [
          exp.transaction_date,
          exp.amount,
          exp.expense_categories?.name || 'Other',
          exp.description || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your expense data has been downloaded as CSV.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveNotificationSettings = async () => {
    // In a real app, this would save to the database
    localStorage.setItem('expense_notifications', JSON.stringify(notifications));
    toast({
      title: "Settings saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const savePreferences = async () => {
    // In a real app, this would save to the database
    localStorage.setItem('expense_preferences', JSON.stringify(preferences));
    toast({
      title: "Preferences saved", 
      description: "Your application preferences have been updated.",
    });
  };

  // Load saved settings on component mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('expense_notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }

    const savedPreferences = localStorage.getItem('expense_preferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Loading your preferences...</p>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetAmount">Amount (zł)</Label>
                    <Input
                      id="budgetAmount"
                      type="number"
                      value={newBudget.amount}
                      onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetPeriod">Period</Label>
                    <Select value={newBudget.period} onValueChange={(value) => setNewBudget({ ...newBudget, period: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetCategory">Category (Optional)</Label>
                    <Select value={newBudget.category_id} onValueChange={(value) => setNewBudget({ ...newBudget, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button onClick={addBudget} className="w-full">
                      Add Budget
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Budgets</CardTitle>
              </CardHeader>
              <CardContent>
                {budgets.length > 0 ? (
                  <div className="space-y-4">
                    {budgets.map(budget => (
                      <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">{budget.amount} zł</span>
                            <Badge variant="secondary">{budget.period}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {budget.category_id ? 
                              categories.find(c => c.id === budget.category_id)?.name || 'Unknown Category' : 
                              'All Categories'
                            }
                          </p>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteBudget(budget.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No budgets set up yet. Add your first budget above.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Expense Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-sm" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Budget Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you're approaching your budget limits
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.budgetAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, budgetAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Weekly Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly spending summaries
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Monthly Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Receive monthly spending summaries
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.monthlyReports}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, monthlyReports: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Expense Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get reminded to log your daily expenses
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.expenseReminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, expenseReminders: checked })}
                  />
                </div>
              </div>

              <Button onClick={saveNotificationSettings} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Application Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={preferences.currency} onValueChange={(value) => setPreferences({ ...preferences, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zł">Polish Złoty (zł)</SelectItem>
                      <SelectItem value="$">US Dollar ($)</SelectItem>
                      <SelectItem value="€">Euro (€)</SelectItem>
                      <SelectItem value="£">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={preferences.theme} onValueChange={(value) => setPreferences({ ...preferences, theme: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={preferences.language} onValueChange={(value) => setPreferences({ ...preferences, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pl">Polski</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={savePreferences} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Data Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Export your expense data to CSV format for backup or analysis in external tools.
                </p>
                <Button onClick={exportData} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export All Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Two-Factor Authentication
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Active Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  These actions cannot be undone. Please be careful.
                </p>
                <div className="space-y-2">
                  <Button variant="destructive" className="w-full">
                    Delete All Data
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};