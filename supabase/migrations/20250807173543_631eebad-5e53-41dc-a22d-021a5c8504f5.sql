-- Remove semantic duplicates and standardize category names
-- Delete "Bills and Utility" (keep "Bills & Utilities")
DELETE FROM public.expense_categories WHERE name = 'Bills and Utility';

-- Delete "Food and Dining" (keep "Food & Dining") 
DELETE FROM public.expense_categories WHERE name = 'Food and Dining';

-- Update any existing expense_transactions that might reference the deleted categories
-- Update transactions that used "Bills and Utility" to use the remaining "Bills & Utilities" category
UPDATE public.expense_transactions 
SET category_id = (SELECT id FROM public.expense_categories WHERE name = 'Bills & Utilities')
WHERE category_id = '3b3ad3e1-5024-482d-83e4-41d20be765f8';

-- Update transactions that used "Food and Dining" to use the remaining "Food & Dining" category
UPDATE public.expense_transactions 
SET category_id = (SELECT id FROM public.expense_categories WHERE name = 'Food & Dining')
WHERE category_id = '5400a419-9edc-41d6-b20d-f5b929a43ea9';