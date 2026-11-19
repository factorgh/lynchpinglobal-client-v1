import nodemailer from "nodemailer";

function getEmailConfig() {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USERNAME || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
  const from =
    process.env.EMAIL_FROM ||
    process.env.EMAIL_USERNAME ||
    "Lynchpin Global <noreply@lynchpinglobal.com>";

  return { host, port, user, pass, from };
}

export const sendEmail = async (emailData) => {
  const { host, port, user, pass, from } = getEmailConfig();

  if (!user || !pass) {
    throw new Error(
      "Email is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, and EMAIL_PASSWORD.",
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from,
      ...emailData,
    });
    console.log("Email sent successfully", info?.messageId || "");
    return info;
  } catch (error) {
    console.error("Error sending email:", error?.message || error);
    throw new Error(
      error?.response || error?.message || "Failed to send email",
    );
  }
};
