import * as React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, heading, muted, otpBox, otpText, paragraph } from './_shared'

interface ReauthProps {
  token?: string
}

export const ReauthenticationEmail = ({ token = '------' }: ReauthProps) => (
  <EmailLayout preview="كود التحقق بتاعك">
    <Text style={heading}>كود التحقق بتاعك 🔒</Text>
    <Text style={paragraph}>
      استخدمي الكود ده عشان تأكدي العملية على حسابك:
    </Text>
    <div style={otpBox}>
      <Text style={otpText}>{token}</Text>
    </div>
    <Text style={muted}>
      الكود صالح لفترة قصيرة. متشاركيهوش مع حد أبداً.
    </Text>
  </EmailLayout>
)

export default ReauthenticationEmail
