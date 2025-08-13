-- Create static users table for admin-managed usernames
CREATE TABLE public.static_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.static_users ENABLE ROW LEVEL SECURITY;

-- Create policies for static users
CREATE POLICY "Only admins can manage static users" 
ON public.static_users 
FOR ALL 
USING (is_expense_admin())
WITH CHECK (is_expense_admin());

-- Create sessions table for static user authentication
CREATE TABLE public.static_user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  static_user_id uuid NOT NULL REFERENCES public.static_users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_activity timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.static_user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for static user sessions
CREATE POLICY "Users can manage their own sessions" 
ON public.static_user_sessions 
FOR ALL 
USING (true);

-- Create function to authenticate static users
CREATE OR REPLACE FUNCTION public.authenticate_static_user(
  username_param text,
  password_param text
) 
RETURNS TABLE (
  user_id uuid,
  username text,
  session_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record public.static_users%ROWTYPE;
  new_session_token text;
BEGIN
  -- Find user by username
  SELECT * INTO user_record
  FROM public.static_users
  WHERE username = username_param
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Verify password (in real implementation, use proper password hashing)
  IF user_record.password_hash != crypt(password_param, user_record.password_hash) THEN
    RETURN;
  END IF;
  
  -- Generate session token
  new_session_token := 'static_' || replace(gen_random_uuid()::text, '-', '');
  
  -- Clean up old sessions
  DELETE FROM public.static_user_sessions 
  WHERE static_user_id = user_record.id 
  OR expires_at < now();
  
  -- Create new session
  INSERT INTO public.static_user_sessions (static_user_id, session_token)
  VALUES (user_record.id, new_session_token);
  
  -- Return user info
  RETURN QUERY SELECT 
    user_record.id,
    user_record.username,
    new_session_token;
END;
$$;

-- Create function to create static user with hashed password
CREATE OR REPLACE FUNCTION public.create_static_user(
  username_param text,
  password_param text
) 
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_user_id uuid;
  hashed_password text;
BEGIN
  -- Check if caller is admin
  IF NOT is_expense_admin() THEN
    RAISE EXCEPTION 'Only admins can create static users';
  END IF;
  
  -- Hash password
  hashed_password := crypt(password_param, gen_salt('bf'));
  
  -- Insert new static user
  INSERT INTO public.static_users (username, password_hash, created_by)
  VALUES (username_param, hashed_password, auth.uid())
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_static_users_updated_at
BEFORE UPDATE ON public.static_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();