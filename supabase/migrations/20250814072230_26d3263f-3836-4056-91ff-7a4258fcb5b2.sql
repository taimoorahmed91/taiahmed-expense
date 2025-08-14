-- Fix RLS policies for static_users to allow proper admin creation
DROP POLICY IF EXISTS "Only admins can manage static users" ON public.static_users;
DROP POLICY IF EXISTS "Users can create their own static users" ON public.static_users;
DROP POLICY IF EXISTS "Users can delete their own static users or admins can d" ON public.static_users;
DROP POLICY IF EXISTS "Users can update their own static users or admins can u" ON public.static_users;
DROP POLICY IF EXISTS "Users can view their own static users, group members, o" ON public.static_users;

-- Create simplified and clear RLS policies for static users
CREATE POLICY "Admins can manage all static users"
ON public.static_users
FOR ALL
TO authenticated
USING (is_expense_admin())
WITH CHECK (is_expense_admin());

CREATE POLICY "Users can view static users they created or are in same group"
ON public.static_users
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by 
  OR is_expense_admin() 
  OR EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = static_users.created_by
  )
);