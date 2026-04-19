/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

// Render text with URLs as clickable links.
function renderWithLinks(text: string): React.ReactNode {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <Link key={i} href={part} style={{ color: '#a8862e', wordBreak: 'break-all' }}>
        {part}
      </Link>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}

interface NotificationEmailProps {
  recipientName: string
  heading: string
  preview: string
  intro: string
  detail?: string
  ctaLabel?: string
  ctaUrl?: string
  closing?: string
}

export const NotificationEmail = ({
  recipientName,
  heading,
  preview,
  intro,
  detail,
  ctaLabel,
  ctaUrl,
  closing,
}: NotificationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandMark}>OPULENCE TALENT COLLECTIVE</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>{heading}</Heading>
          <Text style={text}>Hello {recipientName},</Text>
          <Text style={text}>{intro}</Text>
          {detail ? <Text style={detailStyle}>{renderWithLinks(detail)}</Text> : null}
          {ctaLabel && ctaUrl ? (
            <Section style={buttonWrap}>
              <Button style={button} href={ctaUrl}>{ctaLabel}</Button>
            </Section>
          ) : null}
          {closing ? (
            <>
              <Hr style={divider} />
              <Text style={footer}>{closing}</Text>
            </>
          ) : null}
        </Section>
        <Text style={signature}>— The Opulence Talent Collective Team</Text>
      </Container>
    </Body>
  </Html>
)

export default NotificationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Work Sans", Helvetica, Arial, sans-serif', color: '#2a2520' }
const container = { padding: '40px 20px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { textAlign: 'center' as const, padding: '0 0 32px' }
const brandMark = { fontSize: '11px', letterSpacing: '0.25em', color: '#a8862e', fontWeight: 600 as const, margin: 0 }
const card = { backgroundColor: '#faf6ee', border: '1px solid #e8dfc9', borderRadius: '8px', padding: '40px 36px' }
const h1 = { fontFamily: '"Instrument Serif", Georgia, "Times New Roman", serif', fontSize: '30px', fontWeight: 400 as const, color: '#2a2520', margin: '0 0 24px', lineHeight: 1.2 }
const text = { fontSize: '15px', color: '#4a4239', lineHeight: 1.6, margin: '0 0 18px' }
const detailStyle = { fontSize: '14px', color: '#5a5247', lineHeight: 1.6, margin: '0 0 18px', padding: '14px 18px', backgroundColor: '#f3ecd8', borderRadius: '6px', borderLeft: '3px solid #a8862e', whiteSpace: 'pre-wrap' as const }
const buttonWrap = { textAlign: 'center' as const, padding: '16px 0 8px' }
const button = { backgroundColor: '#a8862e', color: '#ffffff', fontSize: '14px', fontWeight: 600 as const, letterSpacing: '0.05em', borderRadius: '8px', padding: '14px 32px', textDecoration: 'none', textTransform: 'uppercase' as const }
const divider = { borderColor: '#e8dfc9', margin: '24px 0 16px' }
const footer = { fontSize: '12px', color: '#7a6f5e', margin: 0, lineHeight: 1.5 }
const signature = { fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic' as const, fontSize: '14px', color: '#7a6f5e', textAlign: 'center' as const, margin: '24px 0 0' }
