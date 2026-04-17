-- Wire the subscription sync function to fire on every change to subscriptions.
-- Without this trigger, profiles.subscription_active never flips to true,
-- so candidates stay invisible and employer paywalls never unlock even after payment.

CREATE TRIGGER subscriptions_sync_profile
AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_subscription_status();

-- Also add updated_at maintenance trigger on subscriptions
CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();