import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, buttonStyle, buttonWrap, heading, muted, paragraph } from './_shared'

interface MagicLinkEmailProps {
  confirmationUrl?: string
}

export const MagicLinkEmail = ({ confirmationUrl = '#' }: MagicLinkEmailProps) => (
  <EmailLayout preview="رابط الدخول السريع بتاعك ✨">
    <Text style={heading}>رابط الدخول بتاعك جاهز ✨</Text>
    <Text style={paragraph}>
      اضغطي على الزرار اللي تحت وهتدخلي على حسابك على طول من غير كلمة سر.
    </Text>
    <div style={buttonWrap}>
      <Button style={buttonStyle} href={confirmationUrl}>
        دخول سريع
      </Button>
    </div>
    <Text style={muted}>
      لو مكنتيش طلبتي الرابط ده، تجاهلي الإيميل ببساطة.
    </Text>
  </EmailLayout>
)

export default MagicLinkEmail
