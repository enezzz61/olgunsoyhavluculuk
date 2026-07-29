import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT?.trim() || "465");
const secure = (process.env.SMTP_SECURE?.trim() || "true").toLowerCase() === "true";
const user = process.env.SMTP_USER?.trim() || "";
const pass = process.env.SMTP_PASS?.trim() || "";

console.log("SMTP check =>", {
  host,
  port,
  secure,
  user,
  passLength: pass.length,
});

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  requireTLS: true,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log("SMTP verify: OK");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("SMTP verify failed:", message);
  process.exit(1);
}
