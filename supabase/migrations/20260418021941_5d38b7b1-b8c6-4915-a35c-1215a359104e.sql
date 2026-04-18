-- Enums
CREATE TYPE public.verification_doc_type AS ENUM ('government_id');
CREATE TYPE public.verification_doc_status AS ENUM ('pending', 'approved', 'rejected');

-- Table
CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type public.verification_doc_type NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  status public.verification_doc_status NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_documents_user ON public.verification_documents(user_id);
CREATE INDEX idx_verification_documents_status ON public.verification_documents(status);

ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- RLS: candidates manage own; admins manage all
CREATE POLICY "Users can view own verification documents"
  ON public.verification_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can upload own verification documents"
  ON public.verification_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending documents"
  ON public.verification_documents FOR DELETE TO authenticated
  USING (
    (auth.uid() = user_id AND status = 'pending')
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins can update verification documents"
  ON public.verification_documents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- updated_at trigger
CREATE TRIGGER trg_verification_documents_updated_at
BEFORE UPDATE ON public.verification_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-flip profile.verified when a document is approved,
-- and auto-delete file from storage when a document is rejected.
CREATE OR REPLACE FUNCTION public.handle_verification_doc_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  IF NEW.status = 'approved' AND COALESCE(OLD.status::text, '') <> 'approved' THEN
    UPDATE public.profiles
       SET verified = true, updated_at = now()
     WHERE user_id = NEW.user_id;
  END IF;

  IF NEW.status = 'rejected' AND COALESCE(OLD.status::text, '') <> 'rejected' THEN
    DELETE FROM storage.objects
     WHERE bucket_id = 'verification-documents'
       AND name = NEW.file_path;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_verification_doc_review
AFTER UPDATE ON public.verification_documents
FOR EACH ROW EXECUTE FUNCTION public.handle_verification_doc_review();

-- Storage: private bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: files keyed by {user_id}/...
CREATE POLICY "Candidates upload own verification files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Candidates view own verification files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

CREATE POLICY "Candidates delete own verification files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );