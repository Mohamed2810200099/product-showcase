import * as React from 'react'
import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from '@react-email/components'

export const LOGO_URL = 'https://thcxeqlvicwvusmegspk.supabase.co/storage/v1/object/public/media/email/logo.png'
export const BRAND_NAME = 'The Girl House'
export const BRAND_TAGLINE = 'منتجات DM الألمانية الأصلية في مصر'
export const SITE_URL = 'https://thegirlhouse.life'
export const SUPPORT_EMAIL = 'thegirlhouseeg@yahoo.com'
export const WHATSAPP_URL = 'https://wa.me/201000000000'
export const INSTAGRAM_URL = 'https://instagram.com/thegirlhouseeg'

export function EmailLayout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img src={LOGO_URL} alt={BRAND_NAME} width="120" height="120" style={logo} />
            <Heading as="h2" style={brandName}>{BRAND_NAME}</Heading>
            <Text style={tagline}>{BRAND_TAGLINE}</Text>
          </Section>
          <Section style={card}>
            {children}
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              تواصلي معانا في أي وقت 💌
            </Text>
            <Text style={footerLinks}>
              <Link href={WHATSAPP_URL} style={footerLink}>واتساب</Link>
              {' • '}
              <Link href={INSTAGRAM_URL} style={footerLink}>إنستجرام</Link>
              {' • '}
              <Link href={`mailto:${SUPPORT_EMAIL}`} style={footerLink}>الدعم</Link>
            </Text>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} {BRAND_NAME} — كل الحقوق محفوظة
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const fontStack = "'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif"

const main = {
  backgroundColor: '#ffffff',
  fontFamily: fontStack,
  margin: '0',
  padding: '0',
  color: '#3a2a28',
  direction: 'rtl' as const,
}

const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '24px 16px',
}

const headerSection = {
  textAlign: 'center' as const,
  padding: '24px 16px 8px',
}

const logo = {
  margin: '0 auto',
  display: 'block',
  borderRadius: '50%',
  border: '3px solid #e8d3d6',
}

const brandName = {
  fontFamily: "'El Messiri', 'Tajawal', serif",
  fontSize: '26px',
  fontWeight: 700,
  color: '#a85d65',
  margin: '14px 0 4px',
  textAlign: 'center' as const,
}

const tagline = {
  fontSize: '13px',
  color: '#8a6f6f',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}

const card = {
  backgroundColor: '#fdf7f4',
  border: '1px solid #f1dfe1',
  borderRadius: '20px',
  padding: '28px 24px',
  margin: '12px 0 20px',
}

export const heading = {
  fontFamily: "'El Messiri', 'Tajawal', serif",
  fontSize: '22px',
  fontWeight: 700,
  color: '#7a3942',
  margin: '0 0 14px',
  textAlign: 'right' as const,
}

export const paragraph = {
  fontSize: '15px',
  lineHeight: '1.85',
  color: '#4a3735',
  margin: '0 0 14px',
  textAlign: 'right' as const,
}

export const buttonStyle = {
  backgroundColor: '#a85d65',
  backgroundImage: 'linear-gradient(135deg, #b86d75, #8d4751)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  borderRadius: '999px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center' as const,
  boxShadow: '0 6px 18px rgba(168,93,101,0.25)',
}

export const buttonWrap = {
  textAlign: 'center' as const,
  margin: '20px 0 8px',
}

export const otpBox = {
  backgroundColor: '#ffffff',
  border: '2px dashed #d8a9af',
  borderRadius: '14px',
  padding: '18px',
  textAlign: 'center' as const,
  margin: '16px 0',
}

export const otpText = {
  fontFamily: 'monospace',
  fontSize: '28px',
  fontWeight: 700,
  letterSpacing: '6px',
  color: '#7a3942',
  margin: '0',
}

export const muted = {
  fontSize: '13px',
  color: '#8a6f6f',
  lineHeight: '1.7',
  margin: '14px 0 0',
  textAlign: 'right' as const,
}

const footer = {
  textAlign: 'center' as const,
  padding: '12px 16px 24px',
}

const footerText = {
  fontSize: '13px',
  color: '#7a3942',
  margin: '0 0 6px',
}

const footerLinks = {
  fontSize: '13px',
  color: '#8a6f6f',
  margin: '0 0 10px',
}

const footerLink = {
  color: '#a85d65',
  textDecoration: 'none',
  fontWeight: 600,
}

const footerSmall = {
  fontSize: '11px',
  color: '#a89797',
  margin: '6px 0 0',
}
