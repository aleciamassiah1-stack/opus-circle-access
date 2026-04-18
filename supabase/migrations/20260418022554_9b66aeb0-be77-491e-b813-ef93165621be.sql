CREATE OR REPLACE FUNCTION public.handle_verification_doc_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND COALESCE(OLD.status::text, '') <> 'approved' THEN
    UPDATE public.profiles
       SET verified = true, updated_at = now()
     WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;