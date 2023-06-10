const mongoose = require("mongoose");

const verificationOTPSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  otpExpiry: {
    type: Date,
    required: true,
  
  },
});

const VerificationOTP = mongoose.model(
  "VerificationOTP",
  verificationOTPSchema
);

module.exports = VerificationOTP;
