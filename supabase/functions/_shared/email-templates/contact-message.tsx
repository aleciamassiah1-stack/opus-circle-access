/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ContactMessageEmailProps {
  firstName: string
  lastName: string
  email: string
  audience: string
  message: string
}

export const ContactMessageEmail = ({
  firstName,
  lastName,
  email,
  audience,
  message,
}: ContactMessageEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form submission from {firstName} {lastName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandMark}>OPULENCE TALENT COLLECTIVE</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>New Contact Inquiry</Heading>
          <Text style={text}>
            A new message was submitted through the website contact form.
          </Text>
          <Hr style={divider} />
          <Text style={label}>FROM</Text>
          <Text style={value}>{firstName} {lastName}</Text>
          <Text style={label}>EMAIL</Text>
          <Text style={value}>{email}</Text>
          <Text style={label}>AUDIENCE</Text>
          <Text style={value}>{audience}</Text>
          <Text style={label}>MESSAGE</Text>
          <Text style={messageStyle}>{message}</Text>
        </Section>
        <Text style={signature}>— Opulence Talent Collective</Text>
      </Container>
    </Body>
  </Html>
)

export default ContactMessageEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Work Sans", Helvetica, Arial, sans-serif', color: '#2a2520' }
const container = { padding: '40px 20px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { textAlign: 'center' as const, padding: '0 0 32px' }
const brandMark = { fontSize: '11px', letterSpacing: '0.25em', color: '#a8862e', fontWeight: 600 as const, margin: 0 }
const card = { backgroundColor: '#faf6ee', border: '1px solid #e8dfc9', borderRadius: '8px', padding: '40px 36px' }
const h1 = { fontFamily: '"Instrument Serif", Georgia, "Times New Roman", serif', fontSize: '28px', fontWeight: 400 as const, color: '#2a2520', margin: '0 0 16px', lineHeight: 1.2 }
const text = { fontSize: '15px', color: '#4a4239', lineHeight: 1.6, margin: '0 0 16px' }
const label = { fontSize: '10px', color: '#a8862e', letterSpacing: '0.15em', fontWeight: 600 as const, margin: '16px 0 4px', textTransform: 'uppercase' as const }
const value = { fontSize: '15px', color: '#2a2520', margin: '0 0 4px', lineHeight: 1.5 }
const messageStyle = { fontSize: '14px', color: '#4a4239', margin: '0', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }
const divider = { borderColor: '#e8dfc9', margin: '24px 0 8px' }
const signature = { fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic' as const, fontSize: '14px', color: '#7a6f5e', textAlign: 'center' as const, margin: '24px 0 0' }
