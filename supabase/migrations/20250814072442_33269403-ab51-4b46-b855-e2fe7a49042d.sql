-- Debug the admin function and ensure it works properly
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
$function$;

-- Let's also check if there are any issues with the static user creation function
-- Add better error handling and logging
CREATE OR REPLACE FUNCTION public.create_static_user(username_param text, password_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_user_id uuid;
  hashed_password text;
  current_user_id uuid;
  is_admin_result boolean;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Check if we have a user
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check admin status explicitly
  SELECT is_expense_admin() INTO is_admin_result;
  
  IF NOT is_admin_result THEN
    RAISE EXCEPTION 'Only admins can create static users. Current user: %, Is admin: %', current_user_id, is_admin_result;
  END IF;
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.static_users WHERE username = username_param) THEN
    RAISE EXCEPTION 'Username already exists: %', username_param;
  END IF;
  
  -- Hash password using pgcrypto
  hashed_password := crypt(password_param, gen_salt('bf'));
  
  -- Insert new static user
  INSERT INTO public.static_users (username, password_hash, created_by)
  VALUES (username_param, hashed_password, current_user_id)
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$function$;