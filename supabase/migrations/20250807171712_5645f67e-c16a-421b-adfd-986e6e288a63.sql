-- Add is_admin column to expense_profile table
ALTER TABLE public.expense_profile 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Update the existing admin user to be marked as admin
UPDATE public.expense_profile 
SET is_admin = TRUE 
WHERE email = 'taimoorahmed91@gmail.com';

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

-- Create function to promote/demote users (only admins can call this)
CREATE OR REPLACE FUNCTION public.toggle_admin_status(target_user_id UUID, new_admin_status BOOLEAN)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the calling user is an admin
  IF NOT (SELECT is_expense_admin()) THEN
    RAISE EXCEPTION 'Only admins can modify admin status';
  END IF;
  
  -- Update the target user's admin status
  UPDATE public.expense_profile 
  SET is_admin = new_admin_status 
  WHERE user_id = target_user_id;
  
  RETURN FOUND;
END;
$function$