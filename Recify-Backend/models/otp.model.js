const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema(
  {
    email: String,
    otp: {
      type: String,
      required: true,
    },
    otpExpires: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Create an index to automatically delete OTPs after expiration
OtpSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", OtpSchema, "otps");