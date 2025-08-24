const express = require("express");
const {
  getUserDetails,
  updateUserProfile,
  followUser,
  unFollowUser,
  getPublicUserDetails,
} = require("../controllers/user.controller");
const { isAuth } = require("../middlewares/isAuth.middlewares");
const { singleUpload } = require("../middlewares/multer.singlefile.middleware");
const { optionalAuth } = require("../middlewares/optionalAuth.middlewares");
const route = express.Router();

route.get("/details", isAuth, getUserDetails);
route.put("/edit-profile", isAuth, singleUpload, updateUserProfile);
route.put("/follow/:id", isAuth, followUser);
route.put("/unfollow/:id", isAuth, unFollowUser);
route.get("/details/:id", optionalAuth, getPublicUserDetails);

module.exports = route;
