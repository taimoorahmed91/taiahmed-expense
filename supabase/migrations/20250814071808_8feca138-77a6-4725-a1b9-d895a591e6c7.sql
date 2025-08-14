-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the create_static_user function to ensure it works properly
CREATE OR REPLACE FUNCTION public.create_static_user(username_param text, password_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_user_id uuid;
  hashed_password text;
BEGIN
  -- Check if caller is admin
  IF NOT is_expense_admin() THEN
    RAISE EXCEPTION 'Only admins can create static users';
  END IF;
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.static_users WHERE username = username_param) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;
  
  -- Hash password using pgcrypto
  hashed_password := crypt(password_param, gen_salt('bf'));
  
  -- Insert new static user
  INSERT INTO public.static_users (username, password_hash, created_by)
  VALUES (username_param, hashed_password, auth.uid())
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$function$;