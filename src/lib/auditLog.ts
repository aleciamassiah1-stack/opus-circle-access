import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "approve"
  | "reject"
  | "verify"
  | "unverify"
  | "promote_admin"
  | "visibility_show"
  | "visibility_hide"
  | "soft_delete"
  | "restore"
  | "hard_delete";

export async function logAdminAction(
  action: AuditAction,
  targetUserId: string,
  details: Record<string, unknown> = {}
) {
  const { error } = await supabase.rpc("log_admin_action", {
    _action: action,
    _target_user_id: targetUserId,
    _details: details as never,
  });
  if (error) console.warn("audit log failed", action, error.message);
}
