-- Update RLS policies for expense_transactions to allow admins to see all entries
DROP POLICY IF EXISTS "Users can view their own expense transactions" ON public.expense_transactions;
DROP POLICY IF EXISTS "Users can create their own expense transactions" ON public.expense_transactions;
DROP POLICY IF EXISTS "Users can update their own expense transactions" ON public.expense_transactions;
DROP POLICY IF EXISTS "Users can delete their own expense transactions" ON public.expense_transactions;

-- Create new policies that allow both users to see their own and admins to see all
CREATE POLICY "Users can view their own expense transactions or admins can view all" 
ON public.expense_transactions 
FOR SELECT 
USING (auth.uid() = user_id OR is_expense_admin());

CREATE POLICY "Users can create their own expense transactions" 
ON public.expense_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense transactions or admins can update all" 
ON public.expense_transactions 
FOR UPDATE 
USING (auth.uid() = user_id OR is_expense_admin());

CREATE POLICY "Users can delete their own expense transactions or admins can delete all" 
ON public.expense_transactions 
FOR DELETE 
USING (auth.uid() = user_id OR is_expense_admin());

-- Update RLS policies for expense_categories to allow admins to see all categories
DROP POLICY IF EXISTS "Users can view their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can create their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete their own expense categories" ON public.expense_categories;

-- Create new policies that allow both users to see their own and admins to see all
CREATE POLICY "Users can view their own expense categories or admins can view all" 
ON public.expense_categories 
FOR SELECT 
USING (auth.uid() = user_id OR is_expense_admin());

CREATE POLICY "Users can create their own expense categories" 
ON public.expense_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense categories or admins can update all" 
ON public.expense_categories 
FOR UPDATE 
USING (auth.uid() = user_id OR is_expense_admin());

CREATE POLICY "Users can delete their own expense categories or admins can delete all" 
ON public.expense_categories 
FOR DELETE 
USING (auth.uid() = user_id OR is_expense_admin());