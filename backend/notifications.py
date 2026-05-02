"""
Notification service: WhatsApp (Twilio) + Email (SendGrid).
Both services are optional — if keys are missing, calls are skipped gracefully.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ------------------------- Twilio WhatsApp -------------------------
_twilio_client = None


def _get_twilio():
    global _twilio_client
    sid = os.environ.get("TWILIO_ACCOUNT_SID")
    token = os.environ.get("TWILIO_AUTH_TOKEN")
    if not sid or not token:
        return None
    if _twilio_client is None:
        try:
            from twilio.rest import Client
            _twilio_client = Client(sid, token)
        except Exception as e:
            logger.error(f"Twilio init failed: {e}")
            return None
    return _twilio_client


def send_whatsapp(body: str, to_number: Optional[str] = None) -> Optional[str]:
    """Send a WhatsApp message via Twilio Sandbox. Returns message SID or None."""
    client = _get_twilio()
    if not client:
        logger.info("[WhatsApp SKIP] Twilio not configured. Body: " + body[:80])
        return None
    from_ = os.environ.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
    to_ = to_number or os.environ.get("TWILIO_WHATSAPP_TO", "")
    if not to_:
        logger.warning("WhatsApp target not set")
        return None
    try:
        msg = client.messages.create(body=body, from_=from_, to=to_)
        logger.info(f"WhatsApp sent: SID={msg.sid}")
        return msg.sid
    except Exception as e:
        logger.error(f"WhatsApp send failed: {e}")
        return None


# ------------------------- SendGrid Email --------------------------
def send_email(subject: str, html: str, to_email: Optional[str] = None) -> bool:
    """Send an HTML email via SendGrid. Returns True on success."""
    api_key = os.environ.get("SENDGRID_API_KEY")
    if not api_key:
        logger.info(f"[Email SKIP] SendGrid not configured. Subject: {subject}")
        return False
    from_email = os.environ.get("SENDGRID_FROM_EMAIL", "noreply@thegirlhouse.eg")
    to_ = to_email or os.environ.get("SENDGRID_TO_EMAIL", "")
    if not to_:
        logger.warning("Email target not set")
        return False
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        mail = Mail(from_email=from_email, to_emails=to_, subject=subject, html_content=html)
        sg = SendGridAPIClient(api_key)
        resp = sg.send(mail)
        ok = resp.status_code in (200, 201, 202)
        logger.info(f"Email sent: status={resp.status_code}")
        return ok
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False


# ------------------------- Formatters ------------------------------
def format_order_whatsapp(order: dict) -> str:
    items = "\n".join(
        f"• {i['name']} × {i['quantity']} — {i['price'] * i['quantity']:.0f} ج.م"
        for i in order.get("items", [])
    )
    lines = [
        "🎀 *طلب جديد - The Girl House*",
        "━━━━━━━━━━━━━━",
        f"*رقم الطلب:* {order.get('order_number')}",
        f"*العميل:* {order.get('customer_name')}",
        f"*التليفون:* {order.get('phone')}",
    ]
    if order.get("whatsapp") and order["whatsapp"] != order.get("phone"):
        lines.append(f"*واتساب:* {order['whatsapp']}")
    lines.extend([
        f"*المحافظة:* {order.get('governorate')}",
        f"*المدينة:* {order.get('city')}",
        f"*العنوان:* {order.get('address')}",
    ])
    if order.get("notes"):
        lines.append(f"*ملاحظات:* {order['notes']}")
    lines.extend([
        "━━━━━━━━━━━━━━",
        "*المنتجات:*",
        items,
        "━━━━━━━━━━━━━━",
        f"*المجموع الفرعي:* {order.get('subtotal', 0):.0f} ج.م",
        f"*التوصيل:* {order.get('delivery_fee', 0):.0f} ج.م",
    ])
    if order.get("discount", 0) > 0:
        lines.append(f"*الخصم:* -{order['discount']:.0f} ج.م")
    lines.extend([
        f"*الإجمالي:* *{order.get('total', 0):.0f} ج.م*",
        f"*الدفع:* {order.get('payment_method')}",
    ])
    return "\n".join(lines)


def format_order_email(order: dict) -> str:
    items_rows = "".join(
        f"""
        <tr>
          <td style="padding:10px;border-bottom:1px solid #F2D3D5;">{i['name']}</td>
          <td style="padding:10px;border-bottom:1px solid #F2D3D5;text-align:center;">{i['quantity']}</td>
          <td style="padding:10px;border-bottom:1px solid #F2D3D5;text-align:left;color:#B76E79;font-weight:bold;">{i['price'] * i['quantity']:.0f} ج.م</td>
        </tr>"""
        for i in order.get("items", [])
    )
    payment_labels = {
        "cod": "الدفع عند الاستلام", "whatsapp": "طلب واتساب",
        "vodafone_cash": "فودافون كاش", "instapay": "إنستاباي",
    }
    payment_label = payment_labels.get(order.get("payment_method", ""), order.get("payment_method", ""))
    return f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;font-family:'Tajawal',sans-serif;background:#FDF5F5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:30px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(183,110,121,0.15);">
    <tr>
      <td style="background:linear-gradient(135deg,#B76E79,#D98F94);padding:30px;text-align:center;color:white;">
        <h1 style="margin:0;font-size:28px;font-family:serif;">🎀 The Girl House</h1>
        <p style="margin:8px 0 0;opacity:0.9;">طلب جديد وصلك!</p>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;">
        <div style="background:#FDF5F5;border-radius:14px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0;color:#8C8C8C;font-size:12px;">رقم الطلب</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#B76E79;letter-spacing:2px;">{order.get('order_number')}</p>
        </div>

        <h3 style="color:#2C2C2C;margin:0 0 12px;border-bottom:1px solid #F2D3D5;padding-bottom:8px;">بيانات العميل</h3>
        <table width="100%" cellpadding="6" style="font-size:14px;color:#595959;margin-bottom:18px;">
          <tr><td><strong>الاسم:</strong></td><td>{order.get('customer_name')}</td></tr>
          <tr><td><strong>التليفون:</strong></td><td>{order.get('phone')}</td></tr>
          <tr><td><strong>المحافظة:</strong></td><td>{order.get('governorate')} — {order.get('city')}</td></tr>
          <tr><td><strong>العنوان:</strong></td><td>{order.get('address')}</td></tr>
          <tr><td><strong>الدفع:</strong></td><td>{payment_label}</td></tr>
        </table>

        <h3 style="color:#2C2C2C;margin:0 0 12px;border-bottom:1px solid #F2D3D5;padding-bottom:8px;">المنتجات</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:18px;">
          <thead>
            <tr style="background:#F7E7CE;">
              <th style="padding:10px;text-align:right;">المنتج</th>
              <th style="padding:10px;">الكمية</th>
              <th style="padding:10px;text-align:left;">السعر</th>
            </tr>
          </thead>
          <tbody>
            {items_rows}
          </tbody>
        </table>

        <table width="100%" cellpadding="4" style="font-size:14px;color:#595959;">
          <tr><td>المجموع الفرعي</td><td style="text-align:left;">{order.get('subtotal', 0):.0f} ج.م</td></tr>
          <tr><td>التوصيل</td><td style="text-align:left;">{order.get('delivery_fee', 0):.0f} ج.م</td></tr>
          {"<tr><td>الخصم</td><td style='text-align:left;color:#10B981;'>-" + f"{order.get('discount', 0):.0f}" + " ج.م</td></tr>" if order.get('discount', 0) > 0 else ""}
          <tr style="border-top:2px solid #B76E79;"><td style="padding-top:10px;font-size:18px;"><strong>الإجمالي</strong></td><td style="text-align:left;padding-top:10px;font-size:22px;color:#B76E79;"><strong>{order.get('total', 0):.0f} ج.م</strong></td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:#2C2C2C;padding:18px;text-align:center;color:rgba(255,255,255,0.7);font-size:12px;">
        © The Girl House — منتجات عناية ألمانية أصلية
      </td>
    </tr>
  </table>
</body>
</html>
"""
