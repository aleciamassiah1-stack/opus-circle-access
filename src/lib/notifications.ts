import { supabase } from "@/integrations/supabase/client";

type NotificationKind =
  | "new_message"
  | "new_interview_request"
  | "interview_response"
  | "new_resume_request"
  | "resume_response"
  | "account_approved";

interface NotifyArgs {
  recipientUserId: string;
  kind: NotificationKind;
  intro: string;
  detail?: string;
  ctaPath?: string;
}

/**
 * Fire-and-forget email notification. Failures are logged but never block the UI.
 * The recipient's email is looked up server-side; never pass it from the client.
 */
export async function sendNotificationEmail(args: NotifyArgs): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-notification-email", {
      body: args,
    });
    if (error) {
      console.warn("notification email failed", { kind: args.kind, error: error.message });
    }
  } catch (err) {
    console.warn("notification email threw", { kind: args.kind, err });
  }
}
