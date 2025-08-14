-- Create a static user manually first
INSERT INTO public.static_users (username, password_hash, created_by, is_active)
VALUES (
  'testuser', 
  crypt('password123', gen_salt('bf')), 
  (SELECT user_id FROM expense_profile WHERE is_admin = true LIMIT 1),
  true
);

-- Also fix the function to handle the case where expense_profile might not exist
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
  admin_count int;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Check if we have a user
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user has admin profile
  SELECT COUNT(*) INTO admin_count
  FROM expense_profile 
  WHERE user_id = current_user_id AND is_admin = true;
  
  IF admin_count = 0 THEN
    RAISE EXCEPTION 'User % is not an admin or has no expense profile', current_user_id;
  END IF;
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.static_users WHERE username = username_param) THEN
    RAISE EXCEPTION 'Username already exists: %', username_param;
  END IF;
  
  -- Hash password using pgcrypto
  hashed_password := crypt(password_param, gen_salt('bf'));
  
  -- Insert new static user
  INSERT INTO public.static_users (username, password_hash, created_by, is_active)
  VALUES (username_param, hashed_password, current_user_id, true)
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$function$;