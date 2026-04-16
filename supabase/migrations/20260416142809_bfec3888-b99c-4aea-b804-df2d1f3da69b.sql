
-- 1. Expand profiles table with candidate-specific fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS work_authorization text,
  ADD COLUMN IF NOT EXISTS visibility_status text DEFAULT 'hidden',
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS profile_completion integer DEFAULT 0;

-- 2. Job titles reference table
CREATE TABLE public.job_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0
);
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view job titles" ON public.job_titles FOR SELECT TO authenticated USING (true);

INSERT INTO public.job_titles (name, sort_order) VALUES
  ('Private Chef', 1), ('Personal Chef', 2), ('Estate Manager', 3),
  ('Household Manager', 4), ('House Manager', 5), ('Chief of Staff', 6),
  ('Executive Assistant', 7), ('Personal Assistant', 8), ('Butler', 9),
  ('Housekeeper', 10), ('Laundress', 11), ('Nanny', 12), ('Governess', 13),
  ('Driver / Chauffeur', 14), ('Yacht Chef', 15), ('Yacht Steward / Stewardess', 16),
  ('Property Manager', 17), ('Hospitality Director', 18), ('Lifestyle Manager', 19),
  ('Family Office Support', 20), ('Event / Hospitality Coordinator', 21);

-- 3. Specialty tags reference table
CREATE TABLE public.specialty_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0
);
ALTER TABLE public.specialty_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view specialty tags" ON public.specialty_tags FOR SELECT TO authenticated USING (true);

INSERT INTO public.specialty_tags (name, sort_order) VALUES
  ('UHNW', 1), ('HNW', 2), ('Private Household', 3), ('Family Office', 4),
  ('Yacht', 5), ('Luxury Hospitality', 6), ('Fine Dining', 7),
  ('Multi-Property Support', 8), ('Vendor Management', 9), ('Staff Management', 10),
  ('Event Execution', 11), ('Travel Support', 12);

-- 4. Candidate job titles junction
CREATE TABLE public.candidate_job_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title_id uuid NOT NULL REFERENCES public.job_titles(id) ON DELETE CASCADE,
  UNIQUE(profile_id, job_title_id)
);
ALTER TABLE public.candidate_job_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own job titles" ON public.candidate_job_titles FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Paid employers can view candidate job titles" ON public.candidate_job_titles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      has_role(auth.uid(), 'employer'::app_role)
      AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND subscription_active = true)
      AND profile_id IN (
        SELECT id FROM public.profiles
        WHERE approval_status = 'approved' AND subscription_active = true AND visibility_status = 'visible'
      )
    )
  );

-- 5. Candidate specialty tags junction
CREATE TABLE public.candidate_specialty_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.specialty_tags(id) ON DELETE CASCADE,
  UNIQUE(profile_id, tag_id)
);
ALTER TABLE public.candidate_specialty_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own specialty tags" ON public.candidate_specialty_tags FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Paid employers can view candidate tags" ON public.candidate_specialty_tags FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      has_role(auth.uid(), 'employer'::app_role)
      AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND subscription_active = true)
      AND profile_id IN (
        SELECT id FROM public.profiles
        WHERE approval_status = 'approved' AND subscription_active = true AND visibility_status = 'visible'
      )
    )
  );

-- 6. Favorites
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_user_id uuid NOT NULL,
  candidate_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employer_user_id, candidate_profile_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employers manage own favorites" ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = employer_user_id AND has_role(auth.uid(), 'employer'::app_role))
  WITH CHECK (auth.uid() = employer_user_id AND has_role(auth.uid(), 'employer'::app_role));

-- 7. Conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_user_id uuid NOT NULL,
  candidate_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  UNIQUE(employer_user_id, candidate_user_id)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view own conversations" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = employer_user_id OR auth.uid() = candidate_user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Paid employers can create conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = employer_user_id
    AND has_role(auth.uid(), 'employer'::app_role)
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND subscription_active = true)
  );
CREATE POLICY "Participants can update own conversations" ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = employer_user_id OR auth.uid() = candidate_user_id);

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversation participants can view messages" ON public.messages FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE employer_user_id = auth.uid() OR candidate_user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "Conversation participants can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE employer_user_id = auth.uid() OR candidate_user_id = auth.uid()
    )
  );
CREATE POLICY "Recipients can mark messages read" ON public.messages FOR UPDATE TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE employer_user_id = auth.uid() OR candidate_user_id = auth.uid()
    )
    AND sender_id != auth.uid()
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 9. Interview requests
CREATE TABLE public.interview_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_user_id uuid NOT NULL,
  candidate_user_id uuid NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employers can create interview requests" ON public.interview_requests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = employer_user_id
    AND has_role(auth.uid(), 'employer'::app_role)
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND subscription_active = true)
  );
CREATE POLICY "Participants can view own interview requests" ON public.interview_requests FOR SELECT TO authenticated
  USING (auth.uid() = employer_user_id OR auth.uid() = candidate_user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Candidates can update request status" ON public.interview_requests FOR UPDATE TO authenticated
  USING (auth.uid() = candidate_user_id)
  WITH CHECK (auth.uid() = candidate_user_id);
CREATE POLICY "Employers can withdraw own requests" ON public.interview_requests FOR UPDATE TO authenticated
  USING (auth.uid() = employer_user_id)
  WITH CHECK (auth.uid() = employer_user_id);

CREATE TRIGGER update_interview_requests_updated_at BEFORE UPDATE ON public.interview_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 11. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Avatar policies (public read, owner write)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Resume policies (owner + admin read, owner write)
CREATE POLICY "Users can view own resumes" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Paid employers can view resumes" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND has_role(auth.uid(), 'employer'::app_role) AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND subscription_active = true));
CREATE POLICY "Users can upload own resume" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own resume" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own resume" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 12. Useful indexes
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, sent_at);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at);
CREATE INDEX idx_interview_requests_candidate ON public.interview_requests(candidate_user_id, status);
CREATE INDEX idx_interview_requests_employer ON public.interview_requests(employer_user_id, status);
CREATE INDEX idx_profiles_directory ON public.profiles(approval_status, subscription_active, visibility_status);
CREATE INDEX idx_favorites_employer ON public.favorites(employer_user_id);
