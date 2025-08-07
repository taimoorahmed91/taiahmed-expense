-- Add priority column to expense_categories table
ALTER TABLE public.expense_categories 
ADD COLUMN priority integer DEFAULT 999;

-- Set priority values for existing categories in a logical order
UPDATE public.expense_categories SET priority = 1 WHERE name = 'Food & Dining';
UPDATE public.expense_categories SET priority = 2 WHERE name = 'Grocery';
UPDATE public.expense_categories SET priority = 3 WHERE name = 'Transportation';
UPDATE public.expense_categories SET priority = 4 WHERE name = 'Shopping';
UPDATE public.expense_categories SET priority = 5 WHERE name = 'Bills & Utilities';
UPDATE public.expense_categories SET priority = 6 WHERE name = 'Entertainment';
UPDATE public.expense_categories SET priority = 7 WHERE name = 'Healthcare';
UPDATE public.expense_categories SET priority = 8 WHERE name = 'Rental';
UPDATE public.expense_categories SET priority = 9 WHERE name = 'Other';

-- Create an index on priority for better performance
CREATE INDEX IF NOT EXISTS idx_expense_categories_priority ON public.expense_categories(priority);