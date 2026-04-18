-- Report category enum
CREATE TYPE public.report_category AS ENUM (
  'harassment',
  'spam',
  'fake_profile',
  'inappropriate_content',
  'scam',
  'other'
);

-- Report status enum
CREATE TYPE public.report_status AS ENUM (
  'open',
  'under_review',
  'resolved',
  'dismissed'
);

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_user_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  category public.report_category NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  status public.report_status NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (reporter_user_id <> reported_user_id)
);

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX idx_reports_reporter ON public.reports(reporter_user_id);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reporters can submit reports about other users (must be approved + active)
CREATE POLICY "Approved users can submit reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reporter_user_id
  AND reporter_user_id <> reported_user_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND approval_status = 'approved'
      AND deactivated_at IS NULL
  )
);

-- Reporters can view their own reports
CREATE POLICY "Reporters can view own reports"
ON public.reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can update reports
CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
ON public.reports
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Update timestamp trigger
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();