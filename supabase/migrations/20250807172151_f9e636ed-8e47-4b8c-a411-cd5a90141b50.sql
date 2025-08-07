-- Update the is_expense_admin function to check the is_admin column
CREATE OR REPLACE FUNCTION public.is_expense_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE((
    SELECT is_admin FROM public.expense_profile 
    WHERE user_id = auth.uid()
  ), FALSE);
$function$