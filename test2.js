exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email field is present
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find the user by email
    const user = await User.findByEmail({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generat reset token
    const resetToken = uuidv4();

    // Set the reset token and expiration time in the user document
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send the password reset email
    await sendPasswordResetEmail(user.email, resetToken, req.headers.host);

    return res.status(200).json({
      message: "Password reset email sent successfully",
      token: resetToken,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Failed to send password reset email" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Find the user by the reset token and check if it's valid
    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Update the user's password
    user.password = await hashPassword(newPassword);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
};
