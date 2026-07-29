import nodemailer from "nodemailer";
import { apiError, apiJson, getRequestContext, logApiError, logApiEvent } from "@/lib/api-observability";
import { prisma } from "@/lib/prisma";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendWelcomeEmail(email: string) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || smtpUser;

  if (!smtpUser || !smtpPass) {
    console.warn("[newsletter] SMTP credentials not configured");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "Olgunsoy Bültene Hoş Geldiniz!",
      html: `
        <h1>Hoş Geldiniz!</h1>
        <p>Olgunsoy bültenine abone olduğunuz için teşekkür ederiz.</p>
        <p>En yeni ürünler ve özel fırsatlardan haberdar olmak için bizi takip edin.</p>
        <br>
        <p>Saygılarımızla,<br>Olgunsoy Takımı</p>
      `,
    });

    return true;
  } catch (error) {
    console.error("[newsletter] Email send error:", error);
    return false;
  }
}

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/newsletter");
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const source = String(body.source || "site").trim();

    if (!isValidEmail(email)) {
      return apiError(context, 400, "VALIDATION_ERROR", "Gecerli bir e-posta adresi giriniz.");
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing?.active) {
      return apiJson(context, {
        ok: true,
        message: "Bu e-posta zaten bültene kayıtlı.",
      });
    }

    if (existing) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { active: true, source },
      });
    } else {
      await prisma.newsletterSubscriber.create({
        data: { email, source, active: true },
      });
    }

    const emailSent = await sendWelcomeEmail(email);

    if (emailSent) {
      logApiEvent(context, "newsletter.subscribed", { email, source, mode: "gmail" });
      return apiJson(context, {
        ok: true,
        message: "Bulten kaydin alindi. Hosgeldiniz e-postasi gonderildi.",
      });
    }

    console.info("[newsletter-mock]", { email, source });
    logApiEvent(context, "newsletter.subscribed", { email, source, mode: "mock" });

    return apiJson(context, {
      ok: true,
      message: "Bulten kaydin alindi (test modu).",
    });
  } catch (error) {
    logApiError(context, "newsletter.failed", error);
    return apiError(context, 500, "NEWSLETTER_FAILED", "Bulten kaydi su an alinamiyor.");
  }
}
