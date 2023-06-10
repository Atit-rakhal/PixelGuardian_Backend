const nodemailer = require("nodemailer");

// Function to send the OTP to the user's email
const sendOTP = async (email, otp) => {
  try {
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "digitallibrary.69@gmail.com",
        pass: "dqmlztkxdfncmjfm",
      },
    });

    // Create the email content
    const mailOptions = {
      from: "your-email@example.com",
      to: email,
      subject: "Account Verification",
      text: `Your verification OTP is: ${otp}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

module.exports = { sendOTP };
