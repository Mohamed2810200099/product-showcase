import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "thegirlhouseegdm";
const SENDER_DOMAIN = "helb.thegirlhouse.life";
const FROM_DOMAIN = "thegirlhouse.life";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface EnqueueParams {
  templateName: string;
  recipientEmail: string;
  idempotencyKey?: string;
  templateData?: Record<string, unknown>;
}

/**
 * Server-side helper to render + enqueue a transactional email using
 * the service-role client. Safe to call from server functions (e.g.,
 * createOrder) for actions that don't have an authenticated caller
 * (guest checkout). All errors are caught — sending an email must never
 * break the originating action.
 */
export async function enqueueTransactionalEmail(params: EnqueueParams): Promise<{ ok: boolean; reason?: string }> {
  try {
    const template = TEMPLATES[params.templateName];
    if (!template) return { ok: false, reason: "template_not_found" };

    const recipient = template.to || params.recipientEmail;
    if (!recipient) return { ok: false, reason: "no_recipient" };

    const normalized = recipient.toLowerCase();
    const messageId = crypto.randomUUID();
    const idempotencyKey = params.idempotencyKey || messageId;
    const templateData = params.templateData ?? {};

    // Suppression check
    const { data: suppressed } = await supabaseAdmin
      .from("suppressed_emails")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();

    if (suppressed) {
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: params.templateName,
        recipient_email: recipient,
        status: "suppressed",
      });
      return { ok: false, reason: "suppressed" };
    }

    // Get-or-create unsubscribe token
    let unsubscribeToken: string;
    const { data: existing } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .select("token, used_at")
      .eq("email", normalized)
      .maybeSingle();

    if (existing && !existing.used_at) {
      unsubscribeToken = existing.token;
    } else if (existing && existing.used_at) {
      return { ok: false, reason: "unsubscribed" };
    } else {
      unsubscribeToken = generateToken();
      await supabaseAdmin
        .from("email_unsubscribe_tokens")
        .upsert(
          { token: unsubscribeToken, email: normalized },
          { onConflict: "email", ignoreDuplicates: true },
        );
      const { data: stored } = await supabaseAdmin
        .from("email_unsubscribe_tokens")
        .select("token")
        .eq("email", normalized)
        .maybeSingle();
      if (!stored) return { ok: false, reason: "token_storage_failed" };
      unsubscribeToken = stored.token;
    }

    // Render
    const element = React.createElement(template.component, templateData);
    const html = await render(element);
    const plainText = await render(element, { plainText: true });
    const subject =
      typeof template.subject === "function"
        ? template.subject(templateData)
        : template.subject;

    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: params.templateName,
      recipient_email: recipient,
      status: "pending",
    });

    const { error: enqueueError } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text: plainText,
        purpose: "transactional",
        label: params.templateName,
        idempotency_key: idempotencyKey,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: params.templateName,
        recipient_email: recipient,
        status: "failed",
        error_message: "Failed to enqueue email",
      });
      return { ok: false, reason: "enqueue_failed" };
    }

    return { ok: true };
  } catch (err) {
    console.error("enqueueTransactionalEmail failed:", err);
    return { ok: false, reason: "exception" };
  }
}
