const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Your email address
    pass: process.env.SMTP_PASS  // Your email app password
  }
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"CampusKart Admin" <${process.env.SMTP_USER || "no-reply@banasthali.in"}>`,
    to: email,
    subject: "CampusKart Account Verification OTP 🔐",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #3b82f6;">Welcome to CampusKart!</h2>
        <p>Please use the following One-Time Password (OTP) to verify your identity. This OTP is valid for 5 minutes.</p>
        <div style="font-size: 24px; font-weight: bold; background-color: #f1f5f9; padding: 10px; text-align: center; border-radius: 4px; letter-spacing: 2px; color: #1e3a8a;">
          ${otp}
        </div>
        <p style="margin-top: 20px; color: #64748b; font-size: 12px;">If you did not request this OTP, please ignore this email.</p>
      </div>
    `
  };

  // If credentials are not set, log the OTP to the console for development testing
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("==========================================");
    console.log(`[DEV MODE] OTP generated for ${email}: ${otp}`);
    console.log("==========================================");
    return true;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Email sending failed");
  }
};

module.exports = { sendOTPEmail };
