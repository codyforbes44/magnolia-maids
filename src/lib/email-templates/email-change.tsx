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

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your new email address for Magnolia Maids</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Account update</Text>
        <Heading style={h1}>Confirm your new email</Heading>
        <Text style={text}>
          Confirm the email change on your <strong>{siteName}</strong> account
          from <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>.
        </Text>
        <Section style={{ margin: '0 0 26px' }}>
          <Button style={button} href={{confirmationUrl}}>
            Confirm new email
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

export default EmailChangeEmail
