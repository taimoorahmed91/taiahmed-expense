-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'DollarSign',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense transactions table
CREATE TABLE public.expense_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tags TEXT[],
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense budgets table
CREATE TABLE public.expense_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID,
  amount DECIMAL(12,2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expense_categories
CREATE POLICY "Users can view their own expense categories" 
ON public.expense_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expense categories" 
ON public.expense_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense categories" 
ON public.expense_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense categories" 
ON public.expense_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for expense_transactions
CREATE POLICY "Users can view their own expense transactions" 
ON public.expense_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expense transactions" 
ON public.expense_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense transactions" 
ON public.expense_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense transactions" 
ON public.expense_transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for expense_budgets
CREATE POLICY "Users can view their own expense budgets" 
ON public.expense_budgets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expense budgets" 
ON public.expense_budgets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense budgets" 
ON public.expense_budgets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense budgets" 
ON public.expense_budgets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.expense_transactions 
ADD CONSTRAINT fk_expense_transactions_category 
FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON DELETE CASCADE;

ALTER TABLE public.expense_budgets 
ADD CONSTRAINT fk_expense_budgets_category 
FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON DELETE CASCADE;

-- Create updated_at triggers
CREATE TRIGGER update_expense_categories_updated_at
BEFORE UPDATE ON public.expense_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_transactions_updated_at
BEFORE UPDATE ON public.expense_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_budgets_updated_at
BEFORE UPDATE ON public.expense_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_expense_categories_user_id ON public.expense_categories(user_id);
CREATE INDEX idx_expense_transactions_user_id ON public.expense_transactions(user_id);
CREATE INDEX idx_expense_transactions_category_id ON public.expense_transactions(category_id);
CREATE INDEX idx_expense_transactions_date ON public.expense_transactions(transaction_date);
CREATE INDEX idx_expense_budgets_user_id ON public.expense_budgets(user_id);
CREATE INDEX idx_expense_budgets_category_id ON public.expense_budgets(category_id);