const User = require('../models/User');
const { hashPassword,comparePassword } = require('../utils/bcryptUtil');
const path = require('path');
const multer = require('multer');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {  generateToken,verifyToken,}= require('../utils/jwtUtil');
app.use(bodyParser.urlencoded({ extended: true }));





// Signup controller
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, citizenshipNo } = req.body;
    
    // Check if photo file is present in the request
    if (!req.file) {
      return res.status(400).json({ error: 'No photo provided' });
    }

    // Check if all required fields are present
    if (!fullName || !email || !password || !citizenshipNo) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if the user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    
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
       photo: req.file.filename,
      isadmin: false,
      isVerified: false,
    });

    // Save the user to the databbasease
    const savedUser = await newUser.save();
//helloworldh

    //payload for the  JWT token
    const tokenPayload = {
      userId: savedUser._id,
      email: savedUser.email,
    };

    const token= generateToken(tokenPayload);
    console.log(req.body );
    

    // Return the saved user objfullnameect as the response
    return res.status(201).json({savedUser,token:token});
    
  } catch (error) {
    console.error(error); // Log the error for troubleshooting purposes
    return res.status(500).json({ error: 'Signup failed' });
  }
 
};









//login controllers
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if all required fields are present
    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });

    }
console.log("before password coparing ");
    // Compare the provided password with the hashed password in the database
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a JWT token with the user ID in the payload
    const tokenPayload = {
      userId: user._id,
      email: user.email,
    };
    const token= generateToken(tokenPayload);

    // Return the user object and the token as the response
    return res.status(200).json({ sucess:1, msg:"login sucessfully ", token:token});
  } catch (error) {
    console.error(error); // Log the error for troubleshooting purposes
    return res.status(500).json({ error: 'Login failed' });
  }
};

