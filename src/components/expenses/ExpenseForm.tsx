import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [paidBy, setPaidBy] = useState('');

  // Default categories to create if none exist
  const defaultCategories = [
    { name: 'Grocery', color: '#22C55E', icon: 'ShoppingCart' },
    { name: 'Food and Dining', color: '#EF4444', icon: 'Utensils' },
    { name: 'Transportation', color: '#3B82F6', icon: 'Car' },
    { name: 'Entertainment', color: '#8B5CF6', icon: 'Film' },
    { name: 'Bills and Utility', color: '#F59E0B', icon: 'Receipt' },
    { name: 'Rental', color: '#06B6D4', icon: 'Home' }
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
        .order('priority', { ascending: true });

      if (error) throw error;

      if (categories.length === 0) {
        // Create default categories (only if user is admin)
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
        .insert(defaultCategories)
        .select();

      if (error) throw error;
      
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error creating default categories:', error);
      toast({
        title: "Note",
        description: "Only admins can create categories. Using existing categories.",
        variant: "default",
      });
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
      // Combine selected date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const transactionDateTime = new Date(selectedDate);
      transactionDateTime.setHours(hours, minutes, 0, 0);
      
      const { error } = await supabase
        .from('expense_transactions')
        .insert([
          {
            user_id: user?.id,
            amount: parseFloat(amount),
            description: place,
            category_id: categoryId,
            transaction_date: transactionDateTime.toISOString().split('T')[0], // YYYY-MM-DD format
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
      setSelectedDate(new Date());
      const now = new Date();
      setSelectedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
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
    <div className="space-y-8">
      <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            Add New Expense
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-base font-medium">Amount (PLN)</Label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-lg font-semibold text-muted-foreground">zł</span>
                <Input
                  id="amount"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-12 h-14 text-lg font-medium border-2 focus:border-primary"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="place" className="text-base font-medium">Place</Label>
              <Input
                id="place"
                type="text"
                placeholder="Where did you spend?"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="h-12 text-base border-2 focus:border-primary"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="category" className="text-base font-medium">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-12 text-base border-2 focus:border-primary">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="py-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-base">{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-base font-medium">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal border-2 focus:border-primary",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                <Label htmlFor="time" className="text-base font-medium">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-12 h-12 text-base border-2 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Expense"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};