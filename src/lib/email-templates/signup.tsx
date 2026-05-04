import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { BRAND_NAME, EmailLayout, buttonStyle, buttonWrap, heading, muted, paragraph } from './_shared'

interface SignupEmailProps {
  siteName?: string
  siteUrl?: string
  recipient?: string
  confirmationUrl?: string
}

export const SignupEmail = ({ confirmationUrl = '#', recipient }: SignupEmailProps) => (
  <EmailLayout preview={`أهلاً بيكي في ${BRAND_NAME} 💕`}>
    <Text style={heading}>أهلاً بيكي يا قمر 💕</Text>
    <Text style={paragraph}>
      نورتي عيلة <strong>{BRAND_NAME}</strong>! إحنا مبسوطين إنك انضميتي لينا، وعشان نبدأ
      رحلتك معانا محتاجين بس تأكدي إيميلك بالضغط على الزرار اللي تحت 👇
    </Text>
    <div style={buttonWrap}>
      <Button style={buttonStyle} href={confirmationUrl}>
        تأكيد الإيميل
      </Button>
    </div>
    <Text style={paragraph}>
      بمجرد ما تأكدي، هتقدري تتسوقي أحلى منتجات DM الألمانية الأصلية، وتتابعي طلباتك،
      وتستفيدي بعروضنا الحصرية ✨
    </Text>
    <Text style={muted}>
      لو إنتي مش اللي عملتي الحساب ده، تجاهلي الإيميل ومفيش حاجة هتحصل.
      {recipient ? ` (الإيميل: ${recipient})` : ''}
    </Text>
  </EmailLayout>
)

export default SignupEmail
