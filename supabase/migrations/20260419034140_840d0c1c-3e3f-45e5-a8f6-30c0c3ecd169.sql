CREATE POLICY "Conversation participants can view each other's profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  deactivated_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.employer_user_id = profiles.user_id AND c.candidate_user_id = auth.uid())
       OR (c.candidate_user_id = profiles.user_id AND c.employer_user_id = auth.uid())
  )
);