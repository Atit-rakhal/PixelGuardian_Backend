const nodemailer = require("nodemailer");

// Function to send the OTP to the user's email
const sendOTP = async (email, otp) => {
  try {
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      // Configure your email provider here (e.g., Gmail, Outlook, etc.)
      // See Nodemailer documentation for more information
      service: "Gmail",
      auth: {
        user: "surajrasaili190@gmail.com",
        pass: "qhphewrlghngwscj",
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
