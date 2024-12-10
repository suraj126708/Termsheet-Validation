const userModel = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const signUp = async (req, res) => {
  try {
    const {
      fullName,
      dob,
      gender,
      contactNumber,
      email,
      username,
      password,
      address,
      terms,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    const profilePic = req.file.path;

    // Check if the user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists, you can log in." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const newUser = new userModel({
      fullName,
      dob,
      gender,
      contactNumber,
      email,
      username,
      password: hashedPassword,
      address,
      terms,
      profilePic,
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error creating user",
      success: false,
    });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const errMessage = "Invalid email or password!";

    // Check if the user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(403).json({ message: errMessage, success: false });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(403).json({ message: errMessage, success: false });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      success: true,
      token: jwtToken,
      user: {
        email: user.email,
        name: user.fullName,
        username: user.username,
        profilePic: user.profilePic,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error during login",
      success: false,
    });
  }
};

module.exports = { signUp, login };
