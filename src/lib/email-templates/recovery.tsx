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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your Magnolia Maids password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Password reset</Text>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset the password for your{' '}
          <strong>{siteName}</strong> account. If this wasn&rsquo;t you, you can
          safely ignore this email.
        </Text>
        <Section style={{ margin: '0 0 26px' }}>
          <Button style={button} href={{confirmationUrl}}>
            Choose a new password
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

export default RecoveryEmail
