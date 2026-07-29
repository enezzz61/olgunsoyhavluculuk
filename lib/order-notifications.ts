import nodemailer from "nodemailer";
import type { OrderStatus } from "./order-status";

export async function sendOrderStatusNotification({
  orderId,
  status,
  userEmail,
  reason,
}: {
  orderId: string;
  status: OrderStatus;
  userEmail?: string | null;
  reason?: string;
}) {
  if (!userEmail) {
    return;
  }

  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  if (!smtpUser || !smtpPass) {
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const subject = `Sipariş durumu güncellendi: ${status}`;
  const body = [
    `Siparişinizin durumu güncellendi.`,
    `Sipariş No: ${orderId}`,
    `Yeni durum: ${status}`,
    reason ? `Not: ${reason}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await transporter.sendMail({
    from: process.env.NEWSLETTER_FROM_EMAIL?.trim() || smtpUser,
    to: userEmail,
    subject,
    text: body,
  });
}
