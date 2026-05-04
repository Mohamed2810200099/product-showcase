import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, buttonStyle, buttonWrap, heading, muted, paragraph } from './_shared'

interface RecoveryEmailProps {
  confirmationUrl?: string
  recipient?: string
}

export const RecoveryEmail = ({ confirmationUrl = '#' }: RecoveryEmailProps) => (
  <EmailLayout preview="إعادة تعيين كلمة السر بتاعتك">
    <Text style={heading}>طلبتي تغيير كلمة السر؟ 🔐</Text>
    <Text style={paragraph}>
      مفيش مشكلة يا حبي! اضغطي على الزرار اللي تحت عشان تختاري كلمة سر جديدة وترجعي
      تتسوقي بأمان.
    </Text>
    <div style={buttonWrap}>
      <Button style={buttonStyle} href={confirmationUrl}>
        إعادة تعيين كلمة السر
      </Button>
    </div>
    <Text style={muted}>
      الرابط ده صالح لمدة محدودة. لو مكنتيش إنتي اللي طلبتي ده، تجاهلي الإيميل وحسابك
      هيفضل آمن.
    </Text>
  </EmailLayout>
)

export default RecoveryEmail
