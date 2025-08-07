-- Create the expense_profile table to replace profiles
CREATE TABLE public.expense_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.expense_profile ENABLE ROW LEVEL SECURITY;

-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_expense_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.expense_profile 
    WHERE user_id = auth.uid() 
    AND email = 'taimoorahmed91@gmail.com'
  );
$$;

-- Create RLS policy for admin-only access
CREATE POLICY "Only admin can view expense profiles" 
ON public.expense_profile 
FOR ALL
USING (is_expense_admin());

-- Create RLS policy for inserting new profiles (during signup)
CREATE POLICY "Allow insert during signup" 
ON public.expense_profile 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Migrate existing data from profiles to expense_profile
INSERT INTO public.expense_profile (user_id, email, full_name, avatar_url, created_at, updated_at)
SELECT id, email, full_name, avatar_url, created_at, updated_at 
FROM public.profiles;

-- Update the trigger function to use expense_profile instead of profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.expense_profile (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Add updated_at trigger for expense_profile
CREATE TRIGGER update_expense_profile_updated_at
BEFORE UPDATE ON public.expense_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();