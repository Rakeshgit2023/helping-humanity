import nodemailer from "nodemailer";
import { env } from "../../../env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT) || 587,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: `${env.SMTP_FROM_NAME} <${env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

const sendVerificationEmail = async (email: string, otp: string) => {
  await sendEmail(
    email,
    "Verify your email",
    `
      <h2>Welcome!</h2>
      <p>Your email verification OTP is:</p>

      <h1 style="letter-spacing: 8px;">
        ${otp}
      </h1>

      <p>This OTP will expire in 10 minutes.</p>
      <p>If you did not create an account, you can ignore this email.</p>
    `,
  );
};

const sendResetPasswordEmail = async (email: string, otp: string) => {
  await sendEmail(
    email,
    "Reset your password",
    `
      <h2>Password Reset</h2>
      <p>Your password reset OTP is:</p>

      <h1 style="letter-spacing: 8px;">
        ${otp}
      </h1>

      <p>This OTP will expire in 10 minutes.</p>
      <p>If you did not request a password reset, you can ignore this email.</p>
    `,
  );
};

export { sendVerificationEmail, sendResetPasswordEmail };
