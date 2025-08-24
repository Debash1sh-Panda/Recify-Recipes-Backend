const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // who posted the recipe
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ingredients: [
      {
        type: String,
        required: true,
      },
    ],
    instructions: [
      {
        type: String,
        required: true,
      },
    ],
    images: [
      {
        type: String, // Cloudinary or other image URL
      },
    ],
    video: {
      type: String, // optional recipe video URL
    },
    tags: [
      {
        type: String, // e.g., "vegan", "dessert", "healthy"
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // users who saved the recipe
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema, "posts");

// User Reference → who created the post.
// Title + Description → about the recipe.
// Ingredients & Instructions → structured format.
// Images & Video → like Instagram posts.
// Tags → for search & categorization.
// Likes, Comments, Saved Posts → social interaction just like Instagram.
// Timestamps → automatically stores createdAt & updatedAt.
