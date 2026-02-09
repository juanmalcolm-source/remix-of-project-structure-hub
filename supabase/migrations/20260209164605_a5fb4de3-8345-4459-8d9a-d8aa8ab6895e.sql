-- Allow authenticated users to insert convocatorias
CREATE POLICY "authenticated_users_can_insert_convocatorias"
ON public.convocatorias
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update convocatorias they created
CREATE POLICY "users_can_update_own_convocatorias"
ON public.convocatorias
FOR UPDATE
USING (created_by = auth.uid());

-- Allow users to delete convocatorias they created
CREATE POLICY "users_can_delete_own_convocatorias"
ON public.convocatorias
FOR DELETE
USING (created_by = auth.uid());