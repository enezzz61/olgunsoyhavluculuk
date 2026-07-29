import nodemailer from "nodemailer";
import { requireAdmin } from "@/lib/session";
import { apiError, apiJson, getRequestContext, logApiEvent } from "@/lib/api-observability";
import { prisma } from "@/lib/prisma";

function getTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.trim(),
    },
  });
}

function buildMailHtml(subject: string, body: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 12px">${subject}</h2>
      <div style="white-space:pre-line">${body}</div>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
      <p style="font-size:12px;color:#6b7280">Olgunsoy Havluculuk bülten e-postası</p>
    </div>
  `;
}

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/admin/newsletter");
  if (!(await requireAdmin())) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return apiJson(context, { ok: true, subscribers });
}

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/admin/newsletter");
  if (!(await requireAdmin())) {
    return apiError(context, 403, "FORBIDDEN", "Yetkisiz.");
  }

  try {
    const body = await request.json();
    const subject = String(body.subject || "").trim();
    const messageBody = String(body.body || "").trim();

    if (!subject || !messageBody) {
      return apiError(context, 400, "VALIDATION_ERROR", "Konu ve mesaj gerekli.");
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({ where: { active: true } });
    if (!subscribers.length) {
      return apiError(context, 400, "NO_SUBSCRIBERS", "Aktif bülten abonesi bulunamadı.");
    }

    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    if (!smtpUser || !smtpPass) {
      return apiError(context, 500, "SMTP_NOT_CONFIGURED", "SMTP ayarları eksik.");
    }

    const transporter = getTransport();
    let sentCount = 0;

    for (const subscriber of subscribers) {
      await transporter.sendMail({
        from: process.env.NEWSLETTER_FROM_EMAIL?.trim() || smtpUser,
        to: subscriber.email,
        subject,
        html: buildMailHtml(subject, messageBody),
      });
      sentCount += 1;
    }

    logApiEvent(context, "admin.newsletter.sent", { sentCount });

    return apiJson(context, {
      ok: true,
      message: `${sentCount} aboneye bülten gönderildi.`,
      sentCount,
    });
  } catch (error) {
    return apiError(context, 500, "INTERNAL_ERROR", error instanceof Error ? error.message : "Bülten gönderilemedi.");
  }
}
