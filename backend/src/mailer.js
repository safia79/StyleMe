// FR-13: OTP Login Verification (Two-Factor Authentication) — Email Delivery
// Sends the existing OTP code by email via Resend. Does not generate codes.

const { Resend } = require("resend");

// FR-13: OTP Login Verification (Two-Factor Authentication) — Email Delivery
const resend = new Resend(process.env.RESEND_API_KEY);

// FR-13: OTP Login Verification (Two-Factor Authentication) — Email Delivery
async function sendOtpEmail(toEmail, code) {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: toEmail,
      subject: "Your StyleME verification code",
      text: `Your code is: ${code}. It expires in 5 minutes.`,
      html: `<p>Your code is: <strong>${code}</strong>. It expires in 5 minutes.</p>`,
    });
  } catch (err) {
    console.error("FR-13 OTP email send failed:", err);
  }
}

// FR-02: Forgot Password — Email Delivery (Resend)
async function sendPasswordResetEmail(toEmail, resetToken) {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: toEmail,
      subject: "Reset your StyleME password",
      text: `We received a request to reset your password. Your reset token is: ${resetToken}. If you didn't request this, you can ignore this email. This token is valid for 1 hour.`,
      html: `<p>We received a request to reset your password.</p><p>Your reset token is: <strong>${resetToken}</strong></p><p>If you didn't request this, you can ignore this email. This token is valid for 1 hour.</p>`,
    });
  } catch (err) {
    console.error("FR-02 password reset email send failed:", err);
  }
}

module.exports = { sendOtpEmail, sendPasswordResetEmail };
