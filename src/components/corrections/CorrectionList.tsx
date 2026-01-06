import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatDistanceToNow, format } from 'date-fns';
import { Edit, Trash2, Search, CheckCircle, XCircle, Calendar, User, Copy, Filter, ChevronDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Expense {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
  category_id: string;
  user_id: string;
  expense_categories: {
    id: string;
    name: string;
    color: string;
  };
  expense_profile: {
    email: string;
    full_name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export const CorrectionList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [amountFilter, setAmountFilter] = useState({ operator: '', value: '' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [readdingExpense, setReaddingExpense] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editForm, setEditForm] = useState({
    amount: '',
    description: '',
    category_id: '',
    transaction_date: ''
  });
  const [readdForm, setReaddForm] = useState({
    amount: '',
    description: '',
    category_id: '',
    transaction_date: ''
  });

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchCategories();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_transactions')
        .select(`
          id,
          amount,
          description,
          transaction_date,
          created_at,
          category_id,
          user_id,
          expense_categories (
            id,
            name,
            color
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profile information for the current user
      const { data: profileData } = await supabase
        .from('expense_profile')
        .select('user_id, email, full_name')
        .eq('user_id', user?.id)
        .single();

      // Map expenses with profile information
      const expensesWithProfile = data?.map(expense => ({
        ...expense,
        expense_profile: expense.user_id === user?.id ? profileData : null
      })) || [];

      setExpenses(expensesWithProfile);

    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('id, name, color')
        .order('priority', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      amount: expense.amount.toString(),
      description: expense.description || '',
      category_id: expense.category_id,
      transaction_date: expense.transaction_date
    });
  };

  const handleUpdate = async () => {
    if (!editingExpense) return;

    try {
      const { error } = await supabase
        .from('expense_transactions')
        .update({
          amount: parseFloat(editForm.amount),
          description: editForm.description,
          category_id: editForm.category_id,
          transaction_date: editForm.transaction_date
        })
        .eq('id', editingExpense.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense updated successfully",
      });

      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const handleReadd = (expense: Expense) => {
    setReaddingExpense(expense);
    setReaddForm({
      amount: expense.amount.toString(),
      description: expense.description || '',
      category_id: expense.category_id,
      transaction_date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleReaddSubmit = async () => {
    if (!readdingExpense || !user) return;

    try {
      const { error } = await supabase
        .from('expense_transactions')
        .insert({
          amount: parseFloat(readdForm.amount),
          description: readdForm.description,
          category_id: readdForm.category_id,
          transaction_date: readdForm.transaction_date,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense re-added successfully",
      });

      setReaddingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error re-adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to re-add expense",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expense_transactions')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });

      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    // Name/description filter
    const matchesSearch = searchTerm === '' ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.expense_categories.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Amount filter
    let matchesAmount = true;
    if (amountFilter.operator && amountFilter.value) {
      const filterValue = parseFloat(amountFilter.value);
      if (!isNaN(filterValue)) {
        switch (amountFilter.operator) {
          case 'equals':
            matchesAmount = expense.amount === filterValue;
            break;
          case 'less':
            matchesAmount = expense.amount < filterValue;
            break;
          case 'greater':
            matchesAmount = expense.amount > filterValue;
            break;
        }
      }
    }

    // Category filter
    const matchesCategory = categoryFilter === '' || categoryFilter === 'all' || expense.category_id === categoryFilter;

    // Date range filter
    let matchesDateRange = true;
    const transactionDate = new Date(expense.transaction_date);
    if (dateFromFilter) {
      matchesDateRange = matchesDateRange && transactionDate >= new Date(dateFromFilter);
    }
    if (dateToFilter) {
      matchesDateRange = matchesDateRange && transactionDate <= new Date(dateToFilter);
    }

    return matchesSearch && matchesAmount && matchesCategory && matchesDateRange;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setAmountFilter({ operator: '', value: '' });
    setCategoryFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const hasActiveFilters = searchTerm || amountFilter.operator || categoryFilter || dateFromFilter || dateToFilter;

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, amountFilter.operator, amountFilter.value, categoryFilter, dateFromFilter, dateToFilter]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading expenses...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Expense Corrections</h2>
        <p className="text-muted-foreground">Edit or delete your expense records</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={filtersOpen ? "default" : "outline"}
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear all filters">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent className="space-y-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Amount Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amount</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={amountFilter.operator} 
                      onValueChange={(value) => setAmountFilter({ ...amountFilter, operator: value })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="less">Less than</SelectItem>
                        <SelectItem value="greater">Greater than</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Value"
                      value={amountFilter.value}
                      onChange={(e) => setAmountFilter({ ...amountFilter, value: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
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

                {/* Date From Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date From</Label>
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>

                {/* Date To Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date To</Label>
                  <Input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card className="border-2 border-muted/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-xl">
            <span>All Expenses ({filteredExpenses.length})</span>
            {totalPages > 1 && (
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No expenses found</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          ) : (
            currentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-5 border-2 rounded-xl bg-gradient-to-r from-card to-card/90 hover:shadow-md transition-all duration-200 border-muted/30">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm" 
                    style={{ backgroundColor: expense.expense_categories.color }}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{expense.amount.toFixed(2)} zł</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {expense.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {expense.expense_categories.name}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Transaction: {format(new Date(expense.transaction_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Added: {format(new Date(expense.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>By: {expense.user_id === user?.id ? 'You' : (expense.expense_profile?.full_name || expense.expense_profile?.email || 'Unknown User')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Edit Dialog */}
                  <Dialog open={editingExpense?.id === expense.id} onOpenChange={(open) => !open && setEditingExpense(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={editForm.category_id} onValueChange={(value) => setEditForm({...editForm, category_id: value})}>
                            <SelectTrigger>
                              <SelectValue />
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
                        <div>
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={editForm.transaction_date}
                            onChange={(e) => setEditForm({...editForm, transaction_date: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleUpdate} className="flex-1">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Update
                          </Button>
                          <Button variant="outline" onClick={() => setEditingExpense(null)} className="flex-1">
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Re-add Dialog */}
                  <Dialog open={readdingExpense?.id === expense.id} onOpenChange={(open) => !open && setReaddingExpense(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReadd(expense)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Re-add Expense</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="readd-amount">Amount</Label>
                          <Input
                            id="readd-amount"
                            type="number"
                            step="0.01"
                            value={readdForm.amount}
                            onChange={(e) => setReaddForm({...readdForm, amount: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="readd-description">Description</Label>
                          <Textarea
                            id="readd-description"
                            value={readdForm.description}
                            onChange={(e) => setReaddForm({...readdForm, description: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="readd-category">Category</Label>
                          <Select value={readdForm.category_id} onValueChange={(value) => setReaddForm({...readdForm, category_id: value})}>
                            <SelectTrigger>
                              <SelectValue />
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
                        <div>
                          <Label htmlFor="readd-date">Date</Label>
                          <Input
                            id="readd-date"
                            type="date"
                            value={readdForm.transaction_date}
                            onChange={(e) => setReaddForm({...readdForm, transaction_date: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleReaddSubmit} className="flex-1">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Re-add
                          </Button>
                          <Button variant="outline" onClick={() => setReaddingExpense(null)} className="flex-1">
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Alert Dialog */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this expense? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(expense.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    // Show ellipsis for gaps
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};