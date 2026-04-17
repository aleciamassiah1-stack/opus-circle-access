-- 1. Add verified flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- 2. Helper function: lookup user_id by email (admin only)
CREATE OR REPLACE FUNCTION public.find_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can look up users by email';
  END IF;

  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  RETURN uid;
END;
$$;