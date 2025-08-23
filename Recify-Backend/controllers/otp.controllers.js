const otpModel = require("../models/otp.model");
const userModel = require("../models/user.model");

exports.requestOtpForEmailVerification = async (req, res) => {
  console.log(
    "email from requestOtpForEmailVerification",
    req.body.email
    // req.body.phone
  );
  const { email } = req.body;

  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });

  try {
    const user = await userModel.findOne({ email: email });
    if (user) {
      return res.status(409).json({
        success: false,
        message: "Account already exists. Please login!",
      });
    }

    // Generate a 6-digit OTP
    const generateOtp = (length) => {
      let otp = "";
      for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
      }
      return otp;
    };

    const otp = generateOtp(6);

    // Set OTP expiration time
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Check if OTP already exists for the given email
    let otpData = await otpModel.findOne({ email });

    // If OTP exists, update it
    if (otpData) {
      otpData.otp = otp;
      otpData.otpExpires = otpExpires;
    } else {
      // Create a new OTP record if it doesn't exist
      otpData = new otpModel({
        email,
        otp,
        otpExpires: otpExpires,
      });
    }

    await otpData.save();

    // FIXME: Send OTP to email
    // await sendEmailOtpForSignup(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your Email.",
      otp,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

exports.verifyOtpForEmailVerification = async (req, res) => {
  console.log(
    "email and otp from verifyOtpForEmailVerification",
    req.body.email,
    req.body.otp
  );
  const { email, otp } = req.body;

  // Check for empty values in the request bodys
  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP are required." });
  }

  try {
    const otpData = await otpModel.findOne({ email });

    if (!otpData) {
      return res
        .status(400)
        .json({ success: false, message: "No OTP found for this email." });
    }

    // Normalize and compare OTP values
    if (String(otpData.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpData.otpExpires)) {
      await tempOtpModel.deleteOne({ email });
      return res.status(400).json({
        success: false,
        message: "OTP has expired, request a new one.",
      });
    }

    // Send response with tokens
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};