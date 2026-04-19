ALTER TABLE public.interview_requests
  ADD COLUMN IF NOT EXISTS proposed_slots jsonb,
  ADD COLUMN IF NOT EXISTS selected_slot jsonb,
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS meeting_provider text;