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
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional overrides from the client (so the user can preview based on unsaved edits)
    let overrides: Record<string, unknown> = {};
    try {
      if (req.headers.get("content-length") && Number(req.headers.get("content-length")) > 0) {
        overrides = await req.json();
      }
    } catch {
      overrides = {};
    }

    // Load profile + related job titles + tags
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, title, headline, location, bio, years_experience, work_authorization, resume_url, resume_summary")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: titleRows }, { data: tagRows }] = await Promise.all([
      supabase
        .from("candidate_job_titles")
        .select("job_titles(name)")
        .eq("profile_id", profile.id),
      supabase
        .from("candidate_specialty_tags")
        .select("specialty_tags(name)")
        .eq("profile_id", profile.id),
    ]);

    const jobTitles = (titleRows ?? [])
      .map((r: any) => r.job_titles?.name)
      .filter(Boolean);
    const specialties = (tagRows ?? [])
      .map((r: any) => r.specialty_tags?.name)
      .filter(Boolean);

    const merged = {
      first_name: (overrides.first_name as string) ?? profile.first_name ?? "",
      title: (overrides.title as string) ?? profile.title ?? "",
      headline: (overrides.headline as string) ?? profile.headline ?? "",
      location: (overrides.location as string) ?? profile.location ?? "",
      years_experience: (overrides.years_experience as number) ?? profile.years_experience ?? 0,
      job_titles: (overrides.job_titles as string[]) ?? jobTitles,
      specialties: (overrides.specialties as string[]) ?? specialties,
      resume_summary: profile.resume_summary ?? "",
    };

    const profileFacts = [
      merged.title && `Professional title: ${merged.title}`,
      merged.headline && `Headline: ${merged.headline}`,
      merged.location && `Location: ${merged.location}`,
      merged.years_experience > 0 && `Years of experience: ${merged.years_experience}`,
      merged.job_titles.length > 0 && `Job titles: ${merged.job_titles.join(", ")}`,
      merged.specialties.length > 0 && `Specialties: ${merged.specialties.join(", ")}`,
      merged.resume_summary && `Resume summary (anonymized):\n${merged.resume_summary}`,
    ].filter(Boolean).join("\n");

    if (!profileFacts.trim()) {
      return new Response(
        JSON.stringify({ error: "Add a title, headline, job titles, specialties, or upload a resume first so the AI has something to work with." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You write polished, professional bios for candidates on a private luxury talent platform connecting elite private-service professionals (estate managers, private chefs, household managers, executive housekeepers, butlers, personal assistants, etc.) with UHNW principals and family offices.

Tone & style:
- Third-person, confident, refined — never boastful or salesy
- 2 short paragraphs, 90-160 words total
- Lead with the candidate's defining strength and years of experience
- Reference their specialties, principal types served, and what makes them exceptional
- End with a sentence about the kind of placement they're best suited for
- Match the platform's quiet-luxury aesthetic: precise, understated, results-driven

Strict rules:
- NEVER include specific company names, employer names, school names, addresses, phone numbers, or email addresses
- NEVER fabricate credentials, certifications, languages, or facts not present in the input
- If a fact isn't in the input, omit it — do not invent
- Do not use markdown, headings, bullet points, or quotes — return plain prose only
- Do not address the candidate ("you") or the reader directly
- Do not start with the candidate's first name; use their professional title or role descriptor

Return ONLY the bio text, nothing else.`;

    const userPrompt = `Write a polished professional bio using only these facts:

${profileFacts}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI bio generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const bio = aiData.choices?.[0]?.message?.content?.trim();

    if (!bio) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trim to 2000 char limit (matches profileSchema)
    const trimmed = bio.length > 2000 ? bio.slice(0, 1997) + "..." : bio;

    return new Response(JSON.stringify({ bio: trimmed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-bio error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
