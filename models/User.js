const mongoose = require("mongoose");

const VerificationOTP = require("./VerificationOTP");

// const userSchema = new mongoose.Schema({
//   firstName: {
//     type: String,
//     required: true,
//   },
//   lastName: {
//     type: String,
//     required: true,
//   },

//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },

//   password: {
//     type: String,
//     required: true,
//   },

//   citizenshipNo: {
//     type: String,
//     required: true,
//   },

//     photo:
//     {
//       type: String,
//       required:true
//   },

//   isVerified: {
//     type: Boolean,
//     default: false,
//   },
//   isAdmin: {
//     type: Boolean,
//     default: false,
//   },

// });

// const User = mongoose.model("User", userSchema);

// module.exports = User;
// Import the VerificationOTP model

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  


  isVerified: {
    type: Boolean,
    default: false,
  },
  
});

// Define a pre-delete hook to remove related verification data
userSchema.pre("remove", async function (next) {
  try {
    // Find and remove the associated verification data
    await VerificationOTP.deleteMany({ userId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
