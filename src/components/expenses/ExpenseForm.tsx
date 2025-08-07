import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Plus, DollarSign } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export const ExpenseForm = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [place, setPlace] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Default categories to create if none exist
  const defaultCategories = [
    { name: 'Food & Dining', color: '#FF6B6B', icon: 'Utensils' },
    { name: 'Transportation', color: '#4ECDC4', icon: 'Car' },
    { name: 'Shopping', color: '#45B7D1', icon: 'ShoppingBag' },
    { name: 'Entertainment', color: '#96CEB4', icon: 'Film' },
    { name: 'Bills & Utilities', color: '#FFEAA7', icon: 'Receipt' },
    { name: 'Healthcare', color: '#DDA0DD', icon: 'Heart' },
    { name: 'Education', color: '#98D8C8', icon: 'BookOpen' },
    { name: 'Other', color: '#F7DC6F', icon: 'Package' }
  ];

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const { data: categories, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      if (categories.length === 0) {
        // Create default categories
        await createDefaultCategories();
      } else {
        setCategories(categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const createDefaultCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert(
          defaultCategories.map(cat => ({
            ...cat,
            user_id: user?.id
          }))
        )
        .select();

      if (error) throw error;
      
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !place || !categoryId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get current date in CET timezone
      const now = new Date();
      const cetDate = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Berlin"}));
      
      const { error } = await supabase
        .from('expense_transactions')
        .insert([
          {
            user_id: user?.id,
            amount: parseFloat(amount),
            description: place,
            category_id: categoryId,
            transaction_date: cetDate.toISOString().split('T')[0], // YYYY-MM-DD format
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Expense added successfully",
      });

      // Reset form
      setAmount('');
      setPlace('');
      setCategoryId('');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Expense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="place">Place</Label>
            <Input
              id="place"
              type="text"
              placeholder="Where did you spend?"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};