import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden — admins only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId: string | undefined = body.user_id;
    if (!targetUserId || typeof targetUserId !== "string") {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (targetUserId === user.id) {
      return new Response(JSON.stringify({ error: "You cannot delete your own admin account here." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Best-effort cleanup of storage assets
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("avatar_url, resume_url, company_logo_url")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (profile?.resume_url) {
        await admin.storage.from("resumes").remove([profile.resume_url]);
      }
      if (profile?.avatar_url) {
        // avatar_url may be a full URL; only attempt removal if it looks like a path
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
    } catch (e) {
      console.warn("Storage cleanup failed:", e);
    }

    // Delete dependent rows (admin policies allow this; service role bypasses anyway)
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
      // Most tables key on user_id; favorites, candidate_job_titles, candidate_specialty_tags don't.
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

    // Finally, delete the auth user
    const { error: authErr } = await admin.auth.admin.deleteUser(targetUserId);
    if (authErr) {
      return new Response(JSON.stringify({ error: authErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-delete-user error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
