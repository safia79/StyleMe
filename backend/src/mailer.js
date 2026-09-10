// FR-02: Forgot Password — Email Delivery (Resend)

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

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

module.exports = { sendPasswordResetEmail };
