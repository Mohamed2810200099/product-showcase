import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { EmailLayout, buttonStyle, buttonWrap, heading, muted, paragraph } from './_shared'

interface EmailChangeProps {
  confirmationUrl?: string
  newEmail?: string
}

export const EmailChangeEmail = ({ confirmationUrl = '#', newEmail }: EmailChangeProps) => (
  <EmailLayout preview="تأكيد تغيير الإيميل">
    <Text style={heading}>تأكيد الإيميل الجديد 📧</Text>
    <Text style={paragraph}>
      طلبتي تغيير إيميل حسابك{newEmail ? ` لـ ${newEmail}` : ''}. اضغطي على الزرار عشان نأكد
      التغيير.
    </Text>
    <div style={buttonWrap}>
      <Button style={buttonStyle} href={confirmationUrl}>
        تأكيد التغيير
      </Button>
    </div>
    <Text style={muted}>
      لو مكنتيش إنتي اللي طلبتي التغيير، يا ريت تتواصلي معانا فوراً.
    </Text>
  </EmailLayout>
)

export default EmailChangeEmail
