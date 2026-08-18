import * as React from 'react'

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
} from '@react-email/components'

import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  button,
  codeBox,
  container,
  eyebrow,
  footer,
  h1,
  hr,
  link,
  main,
  text,
} from './brand'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your sign-in link for Magnolia Maids</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Sign in</Text>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Tap the button below to sign in to <strong>{siteName}</strong>. The link
          works once and expires shortly.
        </Text>
        <Section style={{ margin: '0 0 26px' }}>
          <Button style={button} href={{confirmationUrl}}>
            Sign in
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Magnolia Maids &middot; Upscale home cleaning in Durant, Oklahoma
          <br />
          Questions? Email{' '}
          <Link href={`mailto:${SUPPORT_EMAIL}`} style={link}>
            {SUPPORT_EMAIL}
          </Link>{' '}
          or call {SUPPORT_PHONE}. Mon&ndash;Fri 8:00 AM&ndash;5:00 PM CST.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
