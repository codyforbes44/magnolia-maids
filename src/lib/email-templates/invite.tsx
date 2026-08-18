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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You have been invited to Magnolia Maids</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Invitation</Text>
        <Heading style={h1}>You&rsquo;ve been invited</Heading>
        <Text style={text}>
          You&rsquo;ve been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Accept below to set up your account.
        </Text>
        <Section style={{ margin: '0 0 26px' }}>
          <Button style={button} href={{confirmationUrl}}>
            Accept invitation
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

export default InviteEmail
