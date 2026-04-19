import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { NotificationEmail } from '../_shared/email-templates/notification.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SENDER_DOMAIN = 'notify.opulencetalentcollective.com'
const FROM_DOMAIN = 'opulencetalentcollective.com'
const ROOT_URL = 'https://opulencetalentcollective.com'
const SITE_NAME = 'Opulence Talent Collective'

type Kind =
  | 'new_message'
  | 'new_interview_request'
  | 'interview_response'
  | 'new_resume_request'
  | 'resume_response'
  | 'account_approved'

const KIND_COPY: Record<Kind, { subject: string; heading: string; ctaLabel: string; ctaPath: string }> = {
  new_message: { subject: 'You have a new message', heading: 'New Message', ctaLabel: 'View Conversation', ctaPath: '/dashboard' },
  new_interview_request: { subject: 'New interview request', heading: 'Interview Request', ctaLabel: 'Review Request', ctaPath: '/dashboard' },
  interview_response: { subject: 'Update on your interview request', heading: 'Interview Update', ctaLabel: 'View Details', ctaPath: '/employer' },
  new_resume_request: { subject: 'Resume access request', heading: 'Resume Access Requested', ctaLabel: 'Review Request', ctaPath: '/dashboard' },
  resume_response: { subject: 'Update on resume access', heading: 'Resume Access Update', ctaLabel: 'View Details', ctaPath: '/employer' },
  account_approved: { subject: 'Your application has been approved', heading: "You're In", ctaLabel: 'Go to Dashboard', ctaPath: '/dashboard' },
}

const BodySchema = z.object({
  recipientUserId: z.string().uuid(),
  kind: z.enum([
    'new_message',
    'new_interview_request',
    'interview_response',
    'new_resume_request',
    'resume_response',
    'account_approved',
  ]),
  intro: z.string().min(1).max(500),
  detail: z.string().max(2000).optional(),
  ctaPath: z.string().max(200).optional(),
})

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = parts[1]
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    return JSON.parse(atob(payload)) as Record<string, unknown>
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Authenticate caller — must be a logged-in user (not service role).
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const token = authHeader.slice('Bearer '.length).trim()
    const claims = parseJwtClaims(token)
    if (!claims || claims.role === 'anon') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const json = await req.json().catch(() => null)
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { recipientUserId, kind, intro, detail, ctaPath } = parsed.data

    // Look up recipient profile via service role (we need their email).
    const supabase = createClient(supabaseUrl, serviceKey)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('user_id', recipientUserId)
      .maybeSingle()

    if (!profile?.email) {
      return new Response(JSON.stringify({ error: 'Recipient not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const copy = KIND_COPY[kind as Kind]
    const ctaUrl = `${ROOT_URL}${ctaPath ?? copy.ctaPath}`
    const recipientName = profile.first_name?.trim() || 'there'

    const props = {
      recipientName,
      heading: copy.heading,
      preview: copy.subject,
      intro,
      detail,
      ctaLabel: copy.ctaLabel,
      ctaUrl,
      closing:
        'You can manage email preferences from your account. If this message reached you in error, please disregard it.',
    }

    const html = await renderAsync(React.createElement(NotificationEmail, props))
    const text = await renderAsync(React.createElement(NotificationEmail, props), { plainText: true })

    const messageId = crypto.randomUUID()
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: kind,
      recipient_email: profile.email,
      status: 'pending',
    })

    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: profile.email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: copy.subject,
        html,
        text,
        purpose: 'transactional',
        label: kind,
        queued_at: new Date().toISOString(),
      },
    })

    if (enqueueError) {
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: kind,
        recipient_email: profile.email,
        status: 'failed',
        error_message: 'Failed to enqueue notification email',
      })
      return new Response(JSON.stringify({ error: 'Could not enqueue email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-notification-email error', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
