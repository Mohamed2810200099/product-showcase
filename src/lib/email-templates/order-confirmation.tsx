import * as React from 'react'
import { Hr, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, EmailLayout, heading, muted, paragraph } from './_shared'

interface OrderItem {
  name: string
  qty: number
  price: number
}

interface OrderConfirmationProps {
  customerName?: string
  orderNumber?: string
  items?: OrderItem[]
  subtotal?: number
  discount?: number
  shipping?: number
  total?: number
  address?: string
  governorate?: string
  city?: string
  phone?: string
}

const fmt = (n: number) => `${n.toLocaleString('ar-EG')} ج.م`

const rowStyle = { fontSize: '14px', color: '#4a3735', margin: '6px 0', textAlign: 'right' as const }
const totalRowStyle = { ...rowStyle, fontSize: '16px', fontWeight: 700 as const, color: '#7a3942' }
const tableLabel = { color: '#8a6f6f' }
const itemRow = {
  fontSize: '14px',
  color: '#4a3735',
  margin: '8px 0',
  paddingBottom: '8px',
  borderBottom: '1px dashed #f1dfe1',
  textAlign: 'right' as const,
}
const detailsBox = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #f1dfe1',
  padding: '14px 16px',
  margin: '14px 0',
}

const OrderConfirmationEmail = ({
  customerName,
  orderNumber = '#0000',
  items = [],
  subtotal = 0,
  discount = 0,
  shipping = 0,
  total = 0,
  address,
  governorate,
  city,
  phone,
}: OrderConfirmationProps) => (
  <EmailLayout preview={`تأكيد طلبك ${orderNumber} من ${BRAND_NAME}`}>
    <Text style={heading}>
      شكراً ليكي{customerName ? ` يا ${customerName}` : ''} 💕
    </Text>
    <Text style={paragraph}>
      وصلنا طلبك بنجاح وفريقنا بيحضرّه ليكي بحب 🌸 هنبعتلك تأكيد تاني لما نشحنه.
    </Text>

    <div style={detailsBox}>
      <Text style={totalRowStyle}>رقم الطلب: {orderNumber}</Text>
    </div>

    <Text style={{ ...heading, fontSize: '17px', marginTop: '8px' }}>منتجاتك:</Text>
    <div>
      {items.map((it, i) => (
        <Text key={i} style={itemRow}>
          {it.name} × {it.qty} <span style={{ float: 'left', fontWeight: 600, color: '#7a3942' }}>{fmt(it.price * it.qty)}</span>
        </Text>
      ))}
    </div>

    <div style={detailsBox}>
      <Text style={rowStyle}><span style={tableLabel}>المجموع: </span>{fmt(subtotal)}</Text>
      {discount > 0 && (
        <Text style={{ ...rowStyle, color: '#a85d65' }}>
          <span style={tableLabel}>خصم: </span>-{fmt(discount)}
        </Text>
      )}
      <Text style={rowStyle}>
        <span style={tableLabel}>الشحن: </span>{shipping === 0 ? 'مجاناً 🎁' : fmt(shipping)}
      </Text>
      <Hr style={{ borderColor: '#f1dfe1', margin: '8px 0' }} />
      <Text style={totalRowStyle}>الإجمالي: {fmt(total)}</Text>
    </div>

    {(address || phone) && (
      <>
        <Text style={{ ...heading, fontSize: '17px' }}>عنوان التوصيل:</Text>
        <div style={detailsBox}>
          {(governorate || city) && <Text style={rowStyle}>📍 {[governorate, city].filter(Boolean).join(' — ')}</Text>}
          {address && <Text style={rowStyle}>🏠 {address}</Text>}
          {phone && <Text style={rowStyle}>📞 {phone}</Text>}
        </div>
      </>
    )}

    <Text style={paragraph}>
      الدفع عند الاستلام كاش 💵 — جهزي مبلغ <strong>{fmt(total)}</strong> للمندوب.
    </Text>
    <Text style={muted}>
      أي استفسار، احنا في الخدمة على واتساب أو الإنستجرام. شكراً لثقتك في {BRAND_NAME} 🌷
    </Text>
  </EmailLayout>
)

export const template = {
  component: OrderConfirmationEmail,
  subject: (data: Record<string, any>) => `تأكيد طلبك ${data.orderNumber ?? ''} من ${BRAND_NAME} 💕`,
  displayName: 'تأكيد الطلب',
  previewData: {
    customerName: 'سارة',
    orderNumber: 'TGH-1024',
    items: [
      { name: 'شامبو Balea للشعر الجاف', qty: 2, price: 180 },
      { name: 'كريم Schaebens للوجه', qty: 1, price: 220 },
    ],
    subtotal: 580,
    discount: 50,
    shipping: 60,
    total: 590,
    address: 'شارع التحرير، الدور 3، شقة 7',
    governorate: 'القاهرة',
    city: 'المعادي',
    phone: '01000000000',
  },
} satisfies TemplateEntry

export default OrderConfirmationEmail
