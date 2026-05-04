import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { BRAND_NAME, EmailLayout, buttonStyle, buttonWrap, heading, muted, paragraph } from './_shared'

interface InviteProps {
  confirmationUrl?: string
}

export const InviteEmail = ({ confirmationUrl = '#' }: InviteProps) => (
  <EmailLayout preview={`دعوة للانضمام لـ ${BRAND_NAME}`}>
    <Text style={heading}>عندك دعوة خاصة 💌</Text>
    <Text style={paragraph}>
      اتعملك حساب على <strong>{BRAND_NAME}</strong>! اضغطي الزرار وكملي تسجيل بياناتك عشان
      تستمتعي بكل المنتجات والعروض.
    </Text>
    <div style={buttonWrap}>
      <Button style={buttonStyle} href={confirmationUrl}>
        قبول الدعوة
      </Button>
    </div>
    <Text style={muted}>الدعوة صالحة لفترة محدودة.</Text>
  </EmailLayout>
)

export default InviteEmail
