-- First, let's see what duplicate categories we have and clean them up
-- We'll keep one set of categories and remove duplicates

-- Remove duplicate categories, keeping the first occurrence of each category name
DELETE FROM public.expense_categories 
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id 
  FROM public.expense_categories 
  ORDER BY name, created_at ASC
);

-- Remove the user_id column from expense_categories since categories should be global
ALTER TABLE public.expense_categories DROP COLUMN user_id;

-- Drop existing RLS policies for expense_categories
DROP POLICY IF EXISTS "Users can view their own expense categories or admins can view all" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can create their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update their own expense categories or admins can update all" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete their own expense categories or admins can delete all" ON public.expense_categories;

-- Create new RLS policies for global categories
-- Everyone can view categories
CREATE POLICY "Anyone can view expense categories" 
ON public.expense_categories 
FOR SELECT 
USING (true);

-- Only admins can create categories
CREATE POLICY "Only admins can create expense categories" 
ON public.expense_categories 
FOR INSERT 
WITH CHECK (is_expense_admin());

-- Only admins can update categories
CREATE POLICY "Only admins can update expense categories" 
ON public.expense_categories 
FOR UPDATE 
USING (is_expense_admin());

-- Only admins can delete categories
CREATE POLICY "Only admins can delete expense categories" 
ON public.expense_categories 
FOR DELETE 
USING (is_expense_admin());