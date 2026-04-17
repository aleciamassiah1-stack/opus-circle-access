-- Add AI resume summary and company profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS resume_summary text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_logo_url text,
  ADD COLUMN IF NOT EXISTS company_website text,
  ADD COLUMN IF NOT EXISTS company_industry text,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS company_description text;

-- Resume access requests: employer asks, candidate approves/denies
CREATE TABLE IF NOT EXISTS public.resume_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_user_id uuid NOT NULL,
  candidate_user_id uuid NOT NULL,
  candidate_profile_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | denied
  message text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employer_user_id, candidate_profile_id)
);

ALTER TABLE public.resume_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paid employers can request resume access"
  ON public.resume_access_requests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = employer_user_id
    AND public.has_role(auth.uid(), 'employer'::app_role)
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND subscription_active = true)
  );

CREATE POLICY "Participants can view resume access requests"
  ON public.resume_access_requests FOR SELECT TO authenticated
  USING (auth.uid() = employer_user_id OR auth.uid() = candidate_user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Candidates can update resume access status"
  ON public.resume_access_requests FOR UPDATE TO authenticated
  USING (auth.uid() = candidate_user_id)
  WITH CHECK (auth.uid() = candidate_user_id);

CREATE POLICY "Employers can withdraw own resume requests"
  ON public.resume_access_requests FOR UPDATE TO authenticated
  USING (auth.uid() = employer_user_id)
  WITH CHECK (auth.uid() = employer_user_id);

CREATE TRIGGER update_resume_access_requests_updated_at
  BEFORE UPDATE ON public.resume_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage: employers can view a candidate's resume only if an approved access request exists
CREATE POLICY "Employers can view resume with approved access"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes'
    AND EXISTS (
      SELECT 1 FROM public.resume_access_requests rar
      JOIN public.profiles p ON p.user_id = rar.candidate_user_id
      WHERE rar.employer_user_id = auth.uid()
        AND rar.status = 'approved'
        AND p.resume_url = storage.objects.name
    )
  );

-- Storage bucket for company logos (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Company logos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Employers can upload own company logo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Employers can update own company logo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Employers can delete own company logo"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);