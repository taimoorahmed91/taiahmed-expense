
-- Delete all records for the user so we can cleanly reimport from the 345-record file
DELETE FROM expense_transactions 
WHERE user_id = 'cf439197-c0cf-487d-936f-fe289a68bb41';
