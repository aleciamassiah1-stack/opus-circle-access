-- Allow admins to delete records across user-related tables
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete favorites" ON public.favorites
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete conversations" ON public.conversations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete messages" ON public.messages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete interview requests" ON public.interview_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resume access requests" ON public.resume_access_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete candidate job titles" ON public.candidate_job_titles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete candidate specialty tags" ON public.candidate_specialty_tags
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notifications" ON public.notifications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));