-- Add is_admin column to expense_profile table
ALTER TABLE public.expense_profile 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;