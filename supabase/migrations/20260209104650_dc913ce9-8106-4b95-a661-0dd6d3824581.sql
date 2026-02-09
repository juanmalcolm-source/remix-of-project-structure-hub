
-- Add missing UPDATE policy for budget_versions
CREATE POLICY "Users can update their project budget versions"
ON public.budget_versions
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = budget_versions.project_id
  AND projects.user_id = auth.uid()
));
