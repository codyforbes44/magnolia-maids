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

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Magnolia Maids verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Security</Text>
        <Heading style={h1}>Your verification code</Heading>
        <Text style={text}>Enter this code to confirm it&rsquo;s you:</Text>
        <Text style={codeBox}>{token}</Text>
        <Text style={text}>
          The code expires in a few minutes. If you didn&rsquo;t request it, no
          action is needed.
        </Text>
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

export default ReauthenticationEmail
