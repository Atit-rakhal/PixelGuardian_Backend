const User = require("../models/User");
const Citizen = require("../models/citizens");
const { hashPassword, comparePassword } = require("../utils/bcryptUtil");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { generateToken } = require("../utils/jwtUtil");
const { unlinkSyncc } = require("../utils/unlinksynccUtil");
app.use(bodyParser.urlencoded({ extended: true }));
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { sendPasswordResetEmail } = require("../utils/nodemailerUtils");
const VerificationOTP = require("../models/VerificationOTP");
const faceapi = require("face-api.js");
const Jimp = require("jimp");

// Signup controller

exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      citizenshipNo,
      userAddress,
    } = req.body;

    // Check if all required fields are present
    if (!firstName || !lastName || !citizenshipNo) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (req.file) {
        unlinkSyncc(req.file.path);
      }
      return res.status(400).json({ error: "User already exists" });
    }

    // Check if the citizenship number matches data in the citizens database
    const citizen = await Citizen.findOne({
      firstName,
      lastName,
      citizenshipNo,
    });
    if (!citizen) {
      return res.status(400).json({ error: "Invalid citizenship details" });
    }

    // Calculate age based on dob and current date
    const currentDate = new Date();
    const dob = citizen.dob;
    const birthDate = new Date(dob);
    const age = currentDate.getFullYear() - birthDate.getFullYear();

    // Validate age (you can set your own age restriction, e.g., 18 years or above)
    if (age < 18) {
      return res
        .status(400)
        .json({ error: "You must be 18 years or older to sign up" });
    }

    // Check if the password matches the confirmed password
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create a new user object with the provided data
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      citizenshipNo,
      userAddress,
      isAdmin: false,
      isVerified: false,
      photo: req.file.filename,
    });

    const uploadedFileName = req.file.originalname;
    console.log(uploadedFileName);
    console.log("befor model loading");
    const faceModelsPath = path.join(__dirname, "..", "facemodels");
    console.log(faceModelsPath);
    const ssdMobilenetv1 = new faceapi.SsdMobilenetv1();
    ssdMobilenetv1.input = req.file.filename;
    console.log("after face models loading ");
    // faceapi.nets.faceLandmark68Net.loadFromDisk("/facemodels");
    // faceapi.nets.faceRecognitionNet.loadFromDisk("/facemodels");
    // Detect faces in the uploaded photo
    const image = await Jimp.read(req.file.path);

    // Resize the image if needed (optional)
    image.resize(800, Jimp.AUTO);

    // Convert the image to a buffer
    const imageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

    // Now, you can use imageBuffer as the input to the model
    const detections = await faceapi
      .detectAllFaces(imageBuffer)
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log("after detections");
    // Extract the facial features of the detected faces
    const facialFeatures = await Promise.all(
      detections.map(async (detection) => {
        const landmarks = detection.landmarks;
        const faceDescriptor = detection.descriptor;

        // Return the facial features as an array
        return [landmarks, faceDescriptor];
      })
    );

    // Save the extracted facial features to the database
    newUser.facialFeatures = facialFeatures;
    await newUser.save();

    // Generate the verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = Date.now() + 3600000; // OTP expires in 1 hour

    // Save the verification OTP to the database
    const verificationOTP = new VerificationOTP({
      userId: newUser._id,
      otp,
      otpExpiry,
    });
    await verificationOTP.save();

    // Send the verification OTP to the user's email
    await sendOTP(email, otp);

    // Payload for the JWT token
    const tokenPayload = {
      userId: newUser._id,
      email: newUser.email,
    };

    // Generate the JWT token
    const token = generateToken(tokenPayload);

    // Return the saved user object and token as the response
    return res.status(201).json({ savedUser: newUser, token });
  } catch (error) {
    console.error(error); // Log the error for troubleshooting purposes
    if (req.file) {
      unlinkSyncc(req.file.path);
    }

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
    verificationOTP.isUsed = true;
    await verificationOTP.save();

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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset token
    const resetToken = uuidv4();
    if ((user.isVerifiederified = false)) {
      return res.status(400).json({ error: "User not verified" });
    }
    // Set the reset token and expiration time in the verification OTP document

    const verificationOTP = new VerificationOTP({
      userId: user._id,
      // otp:,
      // otpExpiry:,
      resetToken,
      resetTokenExpiry: Date.now() + 3600000, // Token expires in 1 hour
    });
    await verificationOTP.save();

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
    const { resetToken, newPassword, confirmnewPassword } = req.body;

    if (newPassword !== confirmnewPassword) {
      return res.status(400).json({ error: "password doesnt matches" });
    }

    // Find the verification OTP document by the reset token and check if it's valid
    const verificationOTP = await VerificationOTP.findOne({
      resetToken,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!verificationOTP) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Find the user by the userId in the verification OTP document
    const user = await User.findById(verificationOTP.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's password
    user.password = await hashPassword(newPassword);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    // Delete the verification OTP document
    await VerificationOTP.deleteOne({ _id: verificationOTP._id });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
};

//create user

exports.createCitizen = async (req, res) => {
  try {
    const { firstName, lastName, dob, citizenshipNo, district, lifestatus } =
      req.body;
    console.log("Received data:", req.body);

    const newCitizen = new Citizen({
      firstName,
      lastName,
      dob,
      citizenshipNo,
      district,
      lifestatus,
    });

    const savedCitizen = await newCitizen.save();

    res.status(201).json({
      message: "Citizen data saved successfully",
      citizen: savedCitizen,
    });
  } catch (error) {
    console.error("Error saving citizen data:", error);
    res.status(500).json({ error: error.message });
  }
};
