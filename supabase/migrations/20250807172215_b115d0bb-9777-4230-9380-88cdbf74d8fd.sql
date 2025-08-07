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