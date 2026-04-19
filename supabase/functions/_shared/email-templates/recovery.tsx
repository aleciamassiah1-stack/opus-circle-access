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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your Opulence Talent Collective password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandMark}>OPULENCE TALENT COLLECTIVE</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset the password for your Opulence Talent Collective account. Click below to choose a new one.
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              Reset Password
            </Button>
          </Section>
          <Hr style={divider} />
          <Text style={footer}>
            If you didn't request this, you may safely ignore this email — your password will remain unchanged.
          </Text>
        </Section>
        <Text style={signature}>— The Opulence Talent Collective Team</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Work Sans", Helvetica, Arial, sans-serif', color: '#2a2520' }
const container = { padding: '40px 20px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { textAlign: 'center' as const, padding: '0 0 32px' }
const brandMark = { fontSize: '11px', letterSpacing: '0.25em', color: '#a8862e', fontWeight: 600 as const, margin: 0 }
const card = { backgroundColor: '#faf6ee', border: '1px solid #e8dfc9', borderRadius: '8px', padding: '40px 36px' }
const h1 = { fontFamily: '"Instrument Serif", Georgia, "Times New Roman", serif', fontSize: '32px', fontWeight: 400 as const, color: '#2a2520', margin: '0 0 24px', lineHeight: 1.2 }
const text = { fontSize: '15px', color: '#4a4239', lineHeight: 1.6, margin: '0 0 18px' }
const buttonWrap = { textAlign: 'center' as const, padding: '16px 0 8px' }
const button = { backgroundColor: '#a8862e', color: '#ffffff', fontSize: '14px', fontWeight: 600 as const, letterSpacing: '0.05em', borderRadius: '8px', padding: '14px 32px', textDecoration: 'none', textTransform: 'uppercase' as const }
const divider = { borderColor: '#e8dfc9', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#7a6f5e', margin: 0, lineHeight: 1.5 }
const signature = { fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic' as const, fontSize: '14px', color: '#7a6f5e', textAlign: 'center' as const, margin: '24px 0 0' }
