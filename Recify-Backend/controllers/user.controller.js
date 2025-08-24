const cloudinary = require("../config/cloudinary.config");
const getDataUri = require("../config/datauri.config");
const userModel = require("../models/user.model");

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const user = await userModel
      .findById(userId)
      .select("-_id -password -refreshToken -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { fullname, bio, pronouns, socialType, socialUrl } = req.body;
    const userId = req.user?.id;
    let profile_image = null;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing." });
    }

    const updatedData = {};
    if (fullname) updatedData.fullname = fullname;
    if (pronouns) updatedData.pronouns = pronouns;
    if (bio !== undefined) updatedData.bio = bio;

    if (socialType && socialUrl) {
      const allowedTypes = ["youtube", "insta", "facebook", "twitter"];
      if (!allowedTypes.includes(socialType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid socialType. Allowed: ${allowedTypes.join(", ")}`,
        });
      }
      updatedData[`socialMediaLink.${socialType}`] = socialUrl;
    }

    if (req.file) {
      try {
        const fileUri = getDataUri(req.file);
        const cloudResponse = await cloudinary.uploader.upload(
          fileUri.content,
          {
            folder: "recify/users_profile",
            resource_type: "image",
          }
        );
        profile_image = cloudResponse.secure_url;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload image in cloud storage",
          details: uploadError.message,
        });
      }
    }

    if (profile_image) updatedData.profile_image = profile_image;

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: updatedData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    res
      .status(500)
      .json({ message: "Server error while updating user profile." });
  }
};
