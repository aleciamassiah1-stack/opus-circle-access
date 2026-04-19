UPDATE public.interview_requests
SET meeting_url = NULL,
    updated_at = now()
WHERE status = 'accepted'
  AND (meeting_url = 'https://meet.google.com/new'
       OR meeting_url ILIKE 'https://meet.google.com/lookup/%');