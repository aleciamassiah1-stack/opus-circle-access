import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { ContactMessageEmail } from '../_shared/email-templates/contact-message.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SENDER_DOMAIN = 'notify.opulencetalentcollective.com'
const FROM_DOMAIN = 'opulencetalentcollective.com'
const SITE_NAME = 'Opulence Talent Collective'
const TO_ADDRESS = 'team@opulencetalentcollective.com'

const BodySchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  audience: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(5000),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
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

    const { firstName, lastName, email, audience, message } = parsed.data

    const html = await renderAsync(
      React.createElement(ContactMessageEmail, { firstName, lastName, email, audience, message })
    )
    const text = await renderAsync(
      React.createElement(ContactMessageEmail, { firstName, lastName, email, audience, message }),
      { plainText: true }
    )

    const supabase = createClient(supabaseUrl, serviceKey)
    const messageId = crypto.randomUUID()

    // Get-or-create a single unsubscribe token for this recipient. The Lovable
    // Email API requires every transactional send to carry one.
    const normalizedEmail = TO_ADDRESS.toLowerCase()
    let unsubscribeToken: string | null = null
    const { data: existingToken } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()
    if (existingToken?.token) {
      unsubscribeToken = existingToken.token
    } else {
      const newToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
      const { data: inserted } = await supabase
        .from('email_unsubscribe_tokens')
        .insert({ email: normalizedEmail, token: newToken })
        .select('token')
        .single()
      unsubscribeToken = inserted?.token ?? newToken
    }

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'contact_message',
      recipient_email: TO_ADDRESS,
      status: 'pending',
    })

    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        idempotency_key: messageId,
        unsubscribe_token: unsubscribeToken,
        to: TO_ADDRESS,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: `Contact form: ${firstName} ${lastName} (${audience})`,
        reply_to: email,
        html,
        text,
        purpose: 'transactional',
        label: 'contact_message',
        queued_at: new Date().toISOString(),
      },
    })

    if (enqueueError) {
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'contact_message',
        recipient_email: TO_ADDRESS,
        status: 'failed',
        error_message: 'Failed to enqueue contact email',
      })
      return new Response(JSON.stringify({ error: 'Could not send message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-contact-message error', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
