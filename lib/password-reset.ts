import crypto from "crypto";
import nodemailer from "nodemailer";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export type PasswordResetPurpose = "admin" | "user";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildResetLink(token: string, purpose: PasswordResetPurpose) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim() || "https://www.olgunsoyhavluculuk.com";
  return `${baseUrl}/sifremi-unuttum?token=${encodeURIComponent(token)}&purpose=${purpose}`;
}

function getSmtpTransportOptions() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "465");
  const secure = (process.env.SMTP_SECURE?.trim() || "true").toLowerCase() === "true";

  return {
    host,
    port: Number.isFinite(port) ? port : 465,
    secure,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.trim(),
    },
  };
}

async function sendResetEmail(email: string, name: string, link: string) {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL?.trim() || smtpUser;

  if (!smtpUser || !smtpPass) {
    console.warn("[password-reset] SMTP credentials not configured");
    return { ok: false, message: "SMTP ayarları eksik; e-posta gönderilemedi." };
  }

  try {
    const transporter = nodemailer.createTransport(getSmtpTransportOptions());

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

    return { ok: true, message: "E-posta gönderildi." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
    console.error("[password-reset] SMTP send failed", error);
    return {
      ok: false,
      message: `${message} (Gmail için SMTP_PASS bir uygulama şifresi olmalı; normal hesabın parolası değil.)`,
    };
  }
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
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  try {
    await prisma.passwordResetToken.create({
      data: {
        email,
        purpose,
        token,
        expiresAt,
        used: false,
      },
    });
  } catch (error) {
    console.error("[password-reset] Token store failed", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Şifre sıfırlama jetonu kaydedilemedi.",
    };
  }

  const link = buildResetLink(token, purpose);
  const mailResult = await sendResetEmail(email, user.name || email, link);

  if (!mailResult.ok) {
    return {
      ok: false,
      message: `Sifre sifirlama baglantisi olusturuldu, ancak e-posta gonderimi basarisiz oldu: ${mailResult.message}`,
    };
  }

  return {
    ok: true,
    message: "Sifre sifirlama baglantisi e-posta ile gonderildi.",
  };
}

export async function consumePasswordResetToken(token: string, newPassword: string) {
  const normalizedToken = String(token || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-f0-9]/g, "");

  if (!normalizedToken || !newPassword || newPassword.length < 6) {
    return { ok: false, message: "Geçersiz istek." };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "Şifre sıfırlama şu anda veritabanı bağlantısı olmadan kullanılamıyor.",
    };
  }

  let record;
  try {
    record = await prisma.passwordResetToken.findFirst({
      where: { token: normalizedToken, used: false },
    });
  } catch (error) {
    console.error("[password-reset] Token lookup failed", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Token doğrulanamadı.",
    };
  }

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

  await prisma.passwordResetToken.update({
    where: { token: normalizedToken },
    data: { used: true },
  });

  return { ok: true, message: "Şifre başarıyla güncellendi." };
}
