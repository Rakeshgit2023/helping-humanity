import nodemailer from "nodemailer";
import path from "path";
import { env } from "../../../env.js";

// Reads the logo directly from backend/src (works whether the app runs from
// src or dist, since we resolve it against the project root / cwd).
const LOGO_PATH = path.join(
  process.cwd(),
  "src",
  "app",
  "comman",
  "utils",
  "assets",
  "logo.png",
);
const LOGO_CID = "helpinhumanity-logo";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT) || 587,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const BRAND = {
  name: "Help In Humanity",
  tagline: "Join Hands And Be A Hero",
  primary: "#1c3d6e", // navy blue — from the logo
  primaryDark: "#122747",
  gold: "#c99a1e", // slightly muted gold — reads more premium than bright yellow
  dark: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f4f6fa",
  cardBg: "#ffffff",
  website: "https://www.helpinhumanity.org",
  supportEmail: "info@helpinhumanity.org",
  phone: "+91 7701996097",
};

const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: `${env.SMTP_FROM_NAME} <${env.SMTP_USER}>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename: "logo.png",
        path: LOGO_PATH,
        cid: LOGO_CID, // referenced in the template as src="cid:helpinhumanity-logo"
      },
    ],
  });
};

/**
 * Shared email shell so both templates stay visually consistent.
 * Pure table-based layout + inline styles for maximum email client compatibility
 * (Gmail, Outlook, Apple Mail all strip <style> tags in <head> unreliably).
 */
const renderEmailShell = (opts: {
  preheader: string;
  heading: string;
  eyebrow: string;
  bodyHtml: string;
}) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${BRAND.name}</title>
    <!--[if mso]>
    <style>table, td { border-collapse: collapse; }</style>
    <![endif]-->
    <style>
      :root { color-scheme: light only; supported-color-schemes: light; }
      /* Belt-and-suspenders: some mail apps (older Gmail Android/iOS) ignore the
         meta tags above and still force their own dark palette. This explicitly
         re-asserts our light colors so text/background pairs stay readable. */
      @media (prefers-color-scheme: dark) {
        body, .email-bg { background-color: ${BRAND.bg} !important; }
        .card-bg { background-color: ${BRAND.cardBg} !important; }
        .heading-text { color: ${BRAND.dark} !important; }
        .body-text { color: ${BRAND.dark} !important; }
        .muted-text { color: ${BRAND.muted} !important; }
        .tagline-text { color: ${BRAND.muted} !important; }
      }
    </style>
  </head>
  <body class="email-bg" bgcolor="${BRAND.bg}" style="margin:0; padding:0; background-color:${BRAND.bg}; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <!-- Preheader (hidden preview text) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${opts.preheader}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${BRAND.bg}" style="background-color:${BRAND.bg}; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${BRAND.cardBg}" class="card-bg" style="max-width:520px; background-color:${BRAND.cardBg}; border-radius:10px; overflow:hidden; border:1px solid ${BRAND.border};">

            <!-- Top border accent -->
            <tr>
              <td style="background-color:${BRAND.primary}; height:3px; font-size:0; line-height:0;">&nbsp;</td>
            </tr>

            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(180deg, #fbf7ec 0%, #ffffff 100%); padding: 40px 40px 28px; text-align:center; border-bottom:1px solid ${BRAND.border};">
                <img
                  src="cid:${LOGO_CID}"
                  width="132"
                  alt="${BRAND.name}"
                  style="display:block; margin:0 auto; width:132px; max-width:50%; height:auto;"
                />
                <p style="margin:16px 0 0; font-size:12.5px; color:${BRAND.muted}; letter-spacing:0.3px;" class="tagline-text">
                  ${BRAND.tagline}
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 36px 40px 8px;">
                <p style="margin:0 0 12px; font-size:11px; font-weight:600; letter-spacing:1px; color:${BRAND.primary}; text-transform:uppercase; text-align:center;">
                  ${opts.eyebrow}
                </p>
                <h1 style="margin:0 0 20px; font-size:21px; color:${BRAND.dark}; text-align:center; font-weight:600;" class="heading-text">
                  ${opts.heading}
                </h1>
                ${opts.bodyHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 28px 40px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-top:1px solid ${BRAND.border}; padding-top:24px;">
                      <p style="margin:0 0 6px; font-size:12.5px; color:${BRAND.dark}; text-align:center; font-weight:600;">
                        Help In Humanity Trust
                      </p>
                      <p style="margin:0 0 14px; font-size:12px; color:${BRAND.muted}; text-align:center;">
                        Reg. No. 1614 &middot; Delhi NCR, India
                      </p>
                      <p style="margin:0; font-size:12px; color:${BRAND.muted}; text-align:center;">
                        ${BRAND.phone} &nbsp;&middot;&nbsp;
                        <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.primary}; text-decoration:none;">${BRAND.supportEmail}</a>
                        &nbsp;&middot;&nbsp;
                        <a href="${BRAND.website}" style="color:${BRAND.primary}; text-decoration:none;">${BRAND.website.replace("https://", "")}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>

          <p style="margin:20px 0 0; font-size:11px; color:#9ca3af; text-align:center; max-width:420px;">
            You're receiving this email because an action was taken using this email address on ${BRAND.name}.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const renderOtpBlock = (otp: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 8px 0 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border:1px solid ${BRAND.border}; border-radius:8px; padding: 20px 36px;">
          <tr>
            <td style="font-size:30px; font-weight:700; letter-spacing:9px; color:${BRAND.dark}; font-family: 'Courier New', monospace; text-align:center;">
              ${otp}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 22px; font-size:12.5px; color:${BRAND.muted}; text-align:center;">
    This code expires in <strong style="color:${BRAND.dark};">10 minutes</strong>.
  </p>
`;

const sendVerificationEmail = async (email: string, otp: string) => {
  const bodyHtml = `
    <p style="margin:0 0 24px; font-size:14.5px; color:${BRAND.dark}; text-align:center; line-height:1.6;" class="body-text">
      Welcome aboard. Use the verification code below to confirm your email address.
    </p>
    ${renderOtpBlock(otp)}
    <p style="margin:0; font-size:12.5px; color:${BRAND.muted}; text-align:center; line-height:1.6;" class="muted-text">
      For your security, never share this code with anyone. If you did not create an account, you can safely ignore this email.
    </p>
  `;

  await sendEmail(
    email,
    "Verify your email",
    renderEmailShell({
      preheader: `Your verification code is ${otp}`,
      eyebrow: "Email Verification",
      heading: "Verify your email address",
      bodyHtml,
    }),
  );
};

const sendResetPasswordEmail = async (email: string, otp: string) => {
  const bodyHtml = `
    <p style="margin:0 0 24px; font-size:14.5px; color:${BRAND.dark}; text-align:center; line-height:1.6;" class="body-text">
      We received a request to reset your password. Use the code below to continue.
    </p>
    ${renderOtpBlock(otp)}
    <p style="margin:0; font-size:12.5px; color:${BRAND.muted}; text-align:center; line-height:1.6;" class="muted-text">
      For your security, never share this code with anyone. If you did not request a password reset, you can safely ignore this email.
    </p>
  `;

  await sendEmail(
    email,
    "Reset your password",
    renderEmailShell({
      preheader: `Your password reset code is ${otp}`,
      eyebrow: "Password Reset",
      heading: "Reset your password",
      bodyHtml,
    }),
  );
};

export { sendVerificationEmail, sendResetPasswordEmail };
