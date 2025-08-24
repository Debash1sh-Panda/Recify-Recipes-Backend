const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");
const userModel = require("../models/user.model");
// const { sendPasswordChangeEmail } = require("../helpers/emails/email.sender.passwordUpdate.helper.js");
// const { sendPasswordResetEmail } = require("../helpers/emails/email.sender.resetPassword.helper.js");

exports.resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (
      !email ||
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "This email is not associated with any account. Please sign up.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpire = Date.now() + 10 * 60 * 1000;

    user.resetPasswordTokenData = {
      resetToken,
      resetTokenExpire,
    };
    await user.save();

    // FIXME:Send the reset email
    // await sendPasswordResetEmail(email, resetToken);

    return res.status(200).json({
      success: true,
      message: "A password reset link has been sent to your email.",
    });
  } catch (error) {
    console.error("❌ Error in resetPasswordRequest:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while processing your request.",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
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
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Both new password and confirm password are required.",
      });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[?,*!@#$%^&+=]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const user = await userModel.findOne({
      "resetPasswordTokenData.resetToken": resetToken,
      "resetPasswordTokenData.resetTokenExpire": { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token. Please request a new one.",
      });
    }

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the old password.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordTokenData = {
      resetToken: null,
      resetTokenExpire: null,
    };

    await user.save();
    await sendPasswordChangeEmail(user);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. Please log in.",
    });
  } catch (error) {
    console.error("Error updating password:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update the password. Please try again later.",
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
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
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!req.user?.id) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing.",
      });
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    const user = await userModel.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      user.password
    );
    if (!isOldPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect.",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the old password.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await sendPasswordChangeEmail(user);

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Error updating password:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update the password.",
    });
  }
};
