import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mode = "soft" | "hard" | "restore";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: roleRow } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden — admins only" }, 403);

    const body = await req.json().catch(() => ({}));
    const targetUserId: string | undefined = body.user_id;
    const mode: Mode = (body.mode as Mode) || "soft";
    const reason: string | undefined = body.reason;

    if (!targetUserId || typeof targetUserId !== "string") {
      return json({ error: "Missing user_id" }, 400);
    }
    if (targetUserId === user.id) {
      return json({ error: "You cannot delete your own admin account here." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // ─── SOFT DELETE ─────────────────────────────────────────────────────
    if (mode === "soft") {
      const purgeAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await admin
        .from("profiles")
        .update({
          deactivated_at: new Date().toISOString(),
          deactivated_by: user.id,
          scheduled_purge_at: purgeAt,
          visibility_status: "hidden",
        })
        .eq("user_id", targetUserId);
      if (error) return json({ error: error.message }, 500);

      // Block sign-in by banning the auth user (revokes sessions too)
      await admin.auth.admin.updateUserById(targetUserId, {
        ban_duration: "876600h", // ~100 years
      });

      await admin.from("admin_audit_log").insert({
        admin_user_id: user.id,
        target_user_id: targetUserId,
        action: "soft_delete",
        details: { reason: reason ?? null, scheduled_purge_at: purgeAt },
      });

      return json({ success: true, mode, scheduled_purge_at: purgeAt });
    }

    // ─── RESTORE ─────────────────────────────────────────────────────────
    if (mode === "restore") {
      const { error } = await admin
        .from("profiles")
        .update({
          deactivated_at: null,
          deactivated_by: null,
          scheduled_purge_at: null,
        })
        .eq("user_id", targetUserId);
      if (error) return json({ error: error.message }, 500);

      await admin.auth.admin.updateUserById(targetUserId, { ban_duration: "none" });

      await admin.from("admin_audit_log").insert({
        admin_user_id: user.id,
        target_user_id: targetUserId,
        action: "restore",
        details: { reason: reason ?? null },
      });

      return json({ success: true, mode });
    }

    // ─── HARD DELETE ─────────────────────────────────────────────────────
    // Best-effort cleanup of storage assets
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("avatar_url, resume_url, company_logo_url, first_name, last_name, email")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (profile?.resume_url) await admin.storage.from("resumes").remove([profile.resume_url]);
      if (profile?.avatar_url) {
        const path = profile.avatar_url.includes("/avatars/")
          ? profile.avatar_url.split("/avatars/")[1]
          : null;
        if (path) await admin.storage.from("avatars").remove([path]);
      }
      if (profile?.company_logo_url) {
        const path = profile.company_logo_url.includes("/company-logos/")
          ? profile.company_logo_url.split("/company-logos/")[1]
          : null;
        if (path) await admin.storage.from("company-logos").remove([path]);
      }

      // Audit BEFORE deletion (snapshot identity)
      await admin.from("admin_audit_log").insert({
        admin_user_id: user.id,
        target_user_id: targetUserId,
        action: "hard_delete",
        details: {
          reason: reason ?? null,
          snapshot: {
            email: profile?.email ?? null,
            name: `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim(),
          },
        },
      });
    } catch (e) {
      console.warn("Storage cleanup / audit snapshot failed:", e);
    }

    const tables = [
      "candidate_job_titles",
      "candidate_specialty_tags",
      "favorites",
      "messages",
      "conversations",
      "interview_requests",
      "resume_access_requests",
      "notifications",
      "subscriptions",
      "user_roles",
      "profiles",
    ];

    for (const t of tables) {
      if (t === "favorites") {
        await admin.from(t).delete().eq("employer_user_id", targetUserId);
      } else if (t === "candidate_job_titles" || t === "candidate_specialty_tags") {
        const { data: prof } = await admin.from("profiles").select("id").eq("user_id", targetUserId).maybeSingle();
        if (prof?.id) await admin.from(t).delete().eq("profile_id", prof.id);
      } else if (t === "conversations" || t === "interview_requests" || t === "resume_access_requests") {
        await admin.from(t).delete().or(`employer_user_id.eq.${targetUserId},candidate_user_id.eq.${targetUserId}`);
      } else if (t === "messages") {
        await admin.from(t).delete().eq("sender_id", targetUserId);
      } else {
        await admin.from(t).delete().eq("user_id", targetUserId);
      }
    }

    const { error: authErr } = await admin.auth.admin.deleteUser(targetUserId);
    if (authErr) return json({ error: authErr.message }, 500);

    return json({ success: true, mode });
  } catch (e) {
    console.error("admin-delete-user error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
