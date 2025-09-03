-- Add paid_by column to expense_transactions table
ALTER TABLE public.expense_transactions 
ADD COLUMN paid_by text;