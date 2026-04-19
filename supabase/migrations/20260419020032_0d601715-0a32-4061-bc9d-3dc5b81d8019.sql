CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
  initial_status public.approval_status;
BEGIN
  user_role := NEW.raw_user_meta_data->>'role';
  -- Employers are auto-approved (no vetting). Candidates need admin review.
  IF user_role = 'employer' THEN
    initial_status := 'approved';
  ELSE
    initial_status := 'pending';
  END IF;

  INSERT INTO public.profiles (user_id, email, first_name, last_name, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    initial_status
  );

  IF user_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role::public.app_role);
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill: auto-approve any existing pending employer accounts
UPDATE public.profiles p
SET approval_status = 'approved',
    updated_at = now()
WHERE p.approval_status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role = 'employer'
  );