const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/bcryptUtil");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { generateToken } = require("../utils/jwtUtil");
app.use(bodyParser.urlencoded({ extended: true }));
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const { sendPasswordResetEmail } = require("../utils/nodemailerUtils");
const VerificationOTP = require("../models/VerificationOTP");

// Signup controller

const { sendOTP } = require("../utils/otpUtil");


exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, citizenshipNo } = req.body;

    console.log(req.body);
    // Check if photo file is present in the request
    // if (!req.file) {
    //   return res.status(400).json({ error: 'No photo provided' });
    // }

    // Check if all required fields are present
    if (!fullName || !citizenshipNo) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // if (req.file) {
      //   const filePath = req.file.path;
      //   fs.unlinkSync(filePath);
      // }
      return res.status(400).json({ error: "User already exists" });
    }
    // const existingcitizenshipNo= await User.findOne({citizenshipNo});

    // if(existingcitizenshipNo){
    //   return res.status(400).json({error: 'citizenship number is already used ' });
    // }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create a new user object with the provided data
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      citizenshipNo,
      isadmin: false,
      isVerified: false,
    });

    // Save the user to the databbasease
    const savedUser = await newUser.save();

    // Generate the verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = Date.now() + 3600000; // OTP expires in 1 hour

    const verificationOTP = new VerificationOTP({
      userId: savedUser._id,
      otp,
      otpExpiry,
    });
    await verificationOTP.save();

    // Send the verification OTP to the user's email
    await sendOTP(email, otp);

    //payload for the  JWT token
    const tokenPayload = {
      userId: savedUser._id,
      email: savedUser.email,
    };

    const token = generateToken(tokenPayload);
    console.log(res.status(400));

    // Return the saved user objfullnameect as the response
    return res.status(201).json({ savedUser, token: token });
  } catch (error) {
    console.error(error); // Log the error for troubleshooting purposes
    return res.status(500).json({ error: "Signup failed" });
  }
};



exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the verification OTP for the user
    const verificationOTP = await VerificationOTP.findOne({ userId: user._id });
    if (!verificationOTP) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Check if the OTP matches and it's not expired
    if (verificationOTP.otp !== otp || verificationOTP.otpExpiry < Date.now()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Mark the user as verified
    user.isVerified = true;
    await user.save();

    // Delete the verification OTP
    await VerificationOTP.findByIdAndDelete(verificationOTP._id);

    return res.status(200).json({ message: "OTP verification successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
};

//login controllers
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if all required fields are present
    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!user.isVerified) {
      return res.status(401).json({ error: "User not verified" });
    }
    console.log("before password comparing ");
    // Compare the provided password with the hashed password in the database
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token with the user ID in the payload
    const tokenPayload = {
      userId: user._id,
      email: user.email,
    };
    const token = generateToken(tokenPayload);

    // Return the user object and the token as the response
    return res.status(200).json({
      id: user._id,
      sucess: 1,
      msg: "login sucessfully ",
      token: token,
    });
  } catch (error) {
    console.error(error); // Log the error for troubleshooting purposes
    return res.status(500).json({ error: "Login failed" });
  }
};

// exports.changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
//     const userId = req.user.id; // Assuming the user ID is available in req.user

//     // Find the user by ID
//     const user = await User.find({_id:userId});
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     console.log(user);

//     // Compare the current password with the stored password
//     const isMatch = await comparePassword(currentPassword, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ error: 'Current password is incorrect' });
//     }

//     // Hash the new password
//     const hashedPassword = await hashPassword(newPassword);

//     // Update the user's password
//     user.password = hashedPassword;
//     await user.save();

//     return res.status(200).json({ message: 'Password changed successfully' });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'Failed to change password' });
//   }
// };

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.body.id;
    console.log(userId);

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the current password with the stored password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to change password" });
  }
};

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
