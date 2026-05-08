-- Fix infinite recursion in users RLS policy
DROP POLICY IF EXISTS "Admin full access on users" ON users;

CREATE POLICY "Admin full access on users" ON users
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
);
