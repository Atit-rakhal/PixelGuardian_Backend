exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, citizenshipNo } = req.body;

    // Check if all required fields are present
    if (!fullName || !citizenshipNo) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Generate the verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = Date.now() + 3600000; // OTP expires in 1 hour
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

    // Save the user to the database
    const savedUser = await newUser.save();

    // Save the verification OTP to the VerificationOTP collection
    const verificationOTP = new VerificationOTP({
      userId: savedUser._id,
      otp,
      otpExpiry,
    });
    await verificationOTP.save();

    // Send the verification OTP to the user's email
    await sendOTP(email, otp);

    //payload for the JWT token
    const tokenPayload = {
      userId: savedUser._id,
      email: savedUser.email,
    };

    const token = generateToken(tokenPayload);

    // Return the saved user object and token as the response
    return res.status(201).json({ savedUser, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Signup failed" });
  }
};
