const express = require("express");
const { getUserDetails, updateUserProfile } = require("../controllers/user.controller");
const { isAuth } = require("../middlewares/isAuth.middlewares");
const { singleUpload } = require("../middlewares/multer.singlefile.middleware");
const route = express.Router();

route.get("/details", isAuth, getUserDetails);
route.put("/edit-profile", isAuth, singleUpload, updateUserProfile);

module.exports = route;
