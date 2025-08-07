-- Update the existing admin user to be marked as admin
UPDATE public.expense_profile 
SET is_admin = TRUE 
WHERE email = 'taimoorahmed91@gmail.com';