import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendAccountEmail({
  to,
  fullName,
  accountId,
  tempPassword,
  role,
}: {
  to: string;
  fullName: string;
  accountId: string;
  tempPassword: string;
  role: string;
}) {
  const greeting = fullName ? `Hello ${fullName},` : "Hello,";
  const expiryHours = Number(process.env.TEMP_PASSWORD_EXPIRY_HOURS ?? 72);
  const subject =
    "Your Academic Harmonisation Portal account has been created";
  const text = `${greeting}

Your account for the Archdiocese of Jos Academic Harmonisation Portal is now active.

Account details:
- Role: ${role}
- Account ID: ${accountId}
- Temporary Password: ${tempPassword}

For security, this temporary password expires in ${expiryHours} hours. Please sign in and change your password immediately.

Important:
• This email contains sensitive credentials. Do not share it.
• If you did not request this account, report immediately to the diocesan administrator.
• Access is logged and governed by diocesan policies.

Regards,
Archdiocese of Jos Academic Harmonisation Portal
`;

  await transporter.sendMail({
    from: `"Archdiocese of Jos Portal" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
}

export async function sendPasswordResetEmail({
  to,
  fullName,
  resetLink,
  expiryHours,
}: {
  to: string;
  fullName: string;
  resetLink: string;
  expiryHours: number;
}) {
  const greeting = fullName ? `Hello ${fullName},` : "Hello,";
  const subject = "Reset your Academic Harmonisation Portal password";
  const text = `${greeting}

We received a request to reset your portal password.

Reset link: ${resetLink}
This link expires in ${expiryHours} hours.

If you did not request this reset, ignore this email or report it to the diocesan administrator.

Regards,
Archdiocese of Jos Academic Harmonisation Portal
`;

  await transporter.sendMail({
    from: `"Archdiocese of Jos Portal" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
}
