// Fans out a push notification to all of a user's registered devices.
//
// Triggered server-to-server (called from `send-notification-email`) so that
// every place we already send an email also sends a push to native devices.
//
// Delivery providers:
//   - iOS: Apple Push Notification service (APNs) via HTTP/2, using a
//     token-based JWT signed with an .p8 key.
//   - Android: Firebase Cloud Messaging (FCM) HTTP v1, using an OAuth token
//     minted from a service-account JSON.
//
// Required secrets (add via the Lovable secrets manager):
//   APNS_KEY_ID            — 10-char Key ID from Apple Developer
//   APNS_TEAM_ID           — 10-char Team ID from Apple Developer
//   APNS_BUNDLE_ID         — e.g. com.opulencetalentcollective.app
//   APNS_AUTH_KEY          — full contents of the .p8 file (PEM, with header/footer)
//   APNS_USE_SANDBOX       — "true" to target sandbox APNs (TestFlight builds)
//   FCM_SERVICE_ACCOUNT    — full JSON of the Firebase service-account key
//
// If any provider is missing credentials the function logs a warning and
// silently skips just that platform — it never fails the parent email call.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  recipientUserId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// ───────────────────────────── APNs ─────────────────────────────

let cachedApnsJwt: { token: string; issuedAt: number } | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function b64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getApnsJwt(): Promise<string | null> {
  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const authKey = Deno.env.get("APNS_AUTH_KEY");
  if (!keyId || !teamId || !authKey) return null;

  const now = Math.floor(Date.now() / 1000);
  // APNs tokens are valid for up to 60 minutes; refresh after 50.
  if (cachedApnsJwt && now - cachedApnsJwt.issuedAt < 50 * 60) {
    return cachedApnsJwt.token;
  }

  const header = b64url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const payload = b64url(JSON.stringify({ iss: teamId, iat: now }));
  const signingInput = `${header}.${payload}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(authKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  const token = `${signingInput}.${b64url(sig)}`;
  cachedApnsJwt = { token, issuedAt: now };
  return token;
}

async function sendApns(
  deviceToken: string,
  body: Body,
): Promise<{ ok: boolean; status: number; reason?: string }> {
  const jwt = await getApnsJwt();
  const bundleId = Deno.env.get("APNS_BUNDLE_ID");
  if (!jwt || !bundleId) {
    return { ok: false, status: 0, reason: "APNs not configured" };
  }
  const sandbox = Deno.env.get("APNS_USE_SANDBOX") === "true";
  const host = sandbox ? "api.sandbox.push.apple.com" : "api.push.apple.com";

  const payload = {
    aps: {
      alert: { title: body.title, body: body.body },
      sound: "default",
      badge: 1,
    },
    ...(body.data ?? {}),
  };

  const res = await fetch(`https://${host}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (res.ok) return { ok: true, status: res.status };
  const reasonJson = await res.text().catch(() => "");
  return { ok: false, status: res.status, reason: reasonJson };
}

// ───────────────────────────── FCM ─────────────────────────────

let cachedFcm: { token: string; expiresAt: number; projectId: string } | null = null;

async function getFcmAccessToken(): Promise<{ token: string; projectId: string } | null> {
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT");
  if (!raw) return null;
  let svc: { client_email: string; private_key: string; project_id: string };
  try {
    svc = JSON.parse(raw);
  } catch {
    console.warn("FCM_SERVICE_ACCOUNT is not valid JSON");
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedFcm && cachedFcm.expiresAt - 60 > now) {
    return { token: cachedFcm.token, projectId: cachedFcm.projectId };
  }

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: svc.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(svc.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  const assertion = `${signingInput}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    console.warn("FCM token exchange failed", res.status, await res.text().catch(() => ""));
    return null;
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedFcm = {
    token: json.access_token,
    expiresAt: now + json.expires_in,
    projectId: svc.project_id,
  };
  return { token: json.access_token, projectId: svc.project_id };
}

async function sendFcm(
  deviceToken: string,
  body: Body,
): Promise<{ ok: boolean; status: number; reason?: string }> {
  const access = await getFcmAccessToken();
  if (!access) return { ok: false, status: 0, reason: "FCM not configured" };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${access.projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${access.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title: body.title, body: body.body },
          data: body.data ?? {},
        },
      }),
    },
  );
  if (res.ok) return { ok: true, status: res.status };
  return { ok: false, status: res.status, reason: await res.text().catch(() => "") };
}

// ───────────────────────────── handler ─────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const json = (await req.json().catch(() => null)) as Body | null;
    if (
      !json ||
      typeof json.recipientUserId !== "string" ||
      typeof json.title !== "string" ||
      typeof json.body !== "string"
    ) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: tokens, error } = await supabase
      .from("device_tokens")
      .select("token, platform")
      .eq("user_id", json.recipientUserId);

    if (error) {
      console.warn("device token lookup failed", error.message);
      return new Response(JSON.stringify({ error: "Lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ delivered: 0, skipped: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    let delivered = 0;
    let skipped = 0;
    const stale: string[] = [];

    for (const row of tokens) {
      try {
        const r =
          row.platform === "ios"
            ? await sendApns(row.token as string, json)
            : row.platform === "android"
              ? await sendFcm(row.token as string, json)
              : { ok: false, status: 0, reason: "Unsupported platform" };

        if (r.ok) {
          delivered++;
        } else if (r.status === 410 || r.status === 404 || /Unregistered/i.test(r.reason ?? "")) {
          // Token is no longer valid — mark for removal.
          stale.push(row.token as string);
          skipped++;
        } else {
          console.warn("push delivery failed", { platform: row.platform, status: r.status, reason: r.reason });
          skipped++;
        }
      } catch (err) {
        console.warn("push delivery threw", err);
        skipped++;
      }
    }

    if (stale.length > 0) {
      await supabase.from("device_tokens").delete().in("token", stale);
    }

    return new Response(JSON.stringify({ delivered, skipped }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (error) {
    console.error("send-push-notification error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  }
});
