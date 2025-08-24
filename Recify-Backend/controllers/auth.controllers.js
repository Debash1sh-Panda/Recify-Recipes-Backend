const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../helpers/jwt.create.helper");
const logActivity = require("../helpers/activities.helper");

exports.signUp = async (req, res) => {
  try {
    const { username, email, password, gender, dob } = req.body;

    if (!(username && email && password && gender && dob)) {
      return res.status(400).json({
        success: false,
        message: "All mandatory fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const usernameRegex = /^(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/;
    if (!usernameRegex.test(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid username. Only letters, numbers, underscores and periods are allowed (max 30 chars).",
      });
    }

    const formattedFullname = normalizedUsername
      .replace(/[_\.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    const existingUser = await userModel.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({
          success: false,
          message: `Account already exists. Please Login!`,
        });
      }
      if (existingUser.username === normalizedUsername) {
        return res.status(409).json({
          success: false,
          message: "Username already exist!",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      fullname: formattedFullname,
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      isActive: true,
      gender: gender?.trim(),
      dob: dob?.trim(),
    });

    await newUser.save();

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    // FIXME: LOG ACTIVITY
    // await logActivity(
    //   newUser._id,
    //   `A new user (${newUser.fullname}) registered successfully.`
    // );

    return res
      .status(200)
      .cookie("rt", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        sameSite: "Lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: "Hay! Welcome to Recify 🎉",
        user: {
          fullname: newUser.fullname,
          username: newUser.username,
          email: newUser.email,
          gender: newUser.gender,
          dob: newUser.dob,
          role: newUser.role,
          isActive: newUser.isActive,
        },
        accessToken,
      });
  } catch (error) {
    console.error("error during user registration", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
};

exports.signIn = async (req, res) => {
  try {
    const { email_or_username, password } = req.body;

    if (!(email_or_username && password)) {
      return res.status(400).json({
        success: false,
        message: "Please provide email/username and password.",
      });
    }

    if (email_or_username.trim().includes(" ") || password.trim().includes(" ")) {
      return res.status(400).json({
        success: false,
        message: "Spaces are not allowed in email/username or password.",
      });
    }

    const inputValue = email_or_username.trim().toLowerCase();

    const existingUser = await userModel.findOne({
      $or: [{ email: inputValue }, { username: inputValue }],
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "No registered user found, please create an account.",
      });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password! Please try again.",
      });
    }

    const accessToken = generateAccessToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    existingUser.refreshToken = refreshToken;
    existingUser.isActive = true;
    await existingUser.save();

    res
      .status(200)
      .cookie("rt", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: "Welcome back 👋",
        user: {
          fullname: existingUser.fullname,
          username: existingUser.username,
          email: existingUser.email,
          role: existingUser.role,
        },
        accessToken,
      });
  } catch (error) {
    console.error("Error during signIn:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error! Please try again later.",
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    if (userId) {
      await userModel.findByIdAndUpdate(userId, {
        refreshToken: null,
        isActive: false,
      });
    }

    res
      .status(200)
      .clearCookie("rt", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      })
      .json({
        success: true,
        message: "You Successfully logged out",
      });
  } catch (error) {
    console.log(error);
    console.error("Error during user logout:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
};

exports.getAccessToken = async (req, res) => {
  try {
    const { rt } = req.cookies;

    // Check if refresh token is provided
    if (!rt) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is missing. Please log in again.",
      });
    }

    // Verify the refresh token
    jwt.verify(
      rt,
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: "Invalid or expired refresh token. Please log in again.",
          });
        }
        console.log("decoded email", decoded.email);

        const user = await userModel.findOne({ email: decoded.email });
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found. Please register.",
          });
        }

        const newAccessToken = generateAccessToken(user);
        res.status(200).json({
          success: true,
          message: "Access token refreshed successfully.",
          accessToken: newAccessToken,
        });
      }
    );
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
};

// const { data } = req.body;

// const decryptedBytes = CryptoJS.AES.decrypt(
//   data,
//   process.env.DECRYPT_SECRET_KEY
// );
// const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

// if (!decryptedText) {
//   return res.status(400).json({
//     success: false,
//     message: "Invalid or tampered encrypted data.",
//   });
// }

// const decryptedPayload = JSON.parse(decryptedText);

// const { email, password } = decryptedPayload;
