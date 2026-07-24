import crypto from "crypto";
import nodemailer from "nodemailer";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export type PasswordResetPurpose = "admin" | "user";

export type PasswordResetTokenRecord = {
  id: string;
  email: string;
  purpose: PasswordResetPurpose;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildResetLink(token: string, purpose: PasswordResetPurpose) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${baseUrl}/sifremi-unuttum?token=${encodeURIComponent(token)}&purpose=${purpose}`;
}

async function sendResetEmail(email: string, name: string, link: string) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || smtpUser;

  if (!smtpUser || !smtpPass) {
    console.warn("[password-reset] SMTP credentials not configured");
    return false;
  }

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
    subject: "Olgunsoy Şifre Sıfırlama İsteği",
    html: `
      <h2>Şifre Sıfırlama</h2>
      <p>Merhaba ${name},</p>
      <p>Şifreni sıfırlamak için aşağıdaki bağlantıya tıklayabilirsin.</p>
      <p><a href="${link}">${link}</a></p>
      <p>Bu bağlantı kısa süreliğine geçerlidir.</p>
      <p>Saygılarımızla,<br/>Olgunsoy Takımı</p>
    `,
  });

  return true;
}

export async function createPasswordResetRequest(email: string, purpose: PasswordResetPurpose) {
  if (!isValidEmail(email)) {
    return { ok: false, message: "Geçerli bir e-posta adresi giriniz." };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "Şifre sıfırlama şu anda veritabanı bağlantısı olmadan kullanılamıyor.",
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: false, message: "Bu e-posta adresine kayıtlı kullanıcı bulunamadı." };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.$runCommandRaw({
    insert: "passwordResetTokens",
    documents: [
      {
        email,
        purpose,
        token,
        expiresAt: expiresAt.toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
      },
    ],
  });

  const link = buildResetLink(token, purpose);
  const mailSent = await sendResetEmail(user.name || email, user.name || email, link);

  return {
    ok: true,
    message: mailSent
      ? "Şifre sıfırlama bağlantısı e-posta ile gönderildi."
      : "Şifre sıfırlama bağlantısı hazırlandı, ancak e-posta gönderimi yapılamadı.",
  };
}

export async function consumePasswordResetToken(token: string, newPassword: string) {
  if (!token || !newPassword || newPassword.length < 6) {
    return { ok: false, message: "Geçersiz istek." };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "Şifre sıfırlama şu anda veritabanı bağlantısı olmadan kullanılamıyor.",
    };
  }

  const tokenDoc = (await prisma.$runCommandRaw({
    find: "passwordResetTokens",
    filter: { token, used: false },
    limit: 1,
  })) as { documents?: PasswordResetTokenRecord[] };

  const record = tokenDoc.documents?.[0];
  if (!record) {
    return { ok: false, message: "Geçersiz veya süresi dolmuş sıfırlama linki." };
  }

  if (new Date(record.expiresAt) < new Date()) {
    return { ok: false, message: "Sıfırlama linkinin süresi dolmuş." };
  }

  const user = await prisma.user.findUnique({ where: { email: record.email } });
  if (!user) {
    return { ok: false, message: "Kullanıcı bulunamadı." };
  }

  const { hash } = await import("bcryptjs");
  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hash(newPassword, 10) },
  });

  await prisma.$runCommandRaw({
    update: "passwordResetTokens",
    updates: [{ q: { token }, u: { $set: { used: true } } }],
  });

  return { ok: true, message: "Şifre başarıyla güncellendi." };
}
