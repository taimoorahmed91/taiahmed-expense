
-- Delete duplicate expense_transactions, keeping the oldest (first created) record
DELETE FROM expense_transactions
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, amount, transaction_date, LOWER(COALESCE(description, ''))
      ORDER BY created_at ASC
    ) as rn
    FROM expense_transactions
  ) sub
  WHERE rn > 1
);
