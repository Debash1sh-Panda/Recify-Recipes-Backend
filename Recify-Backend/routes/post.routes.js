const express = require("express");
const { isAuth } = require("../middlewares/isAuth.middlewares");
const { likePost, unlikePost } = require("../controllers/post.controllers.js");
const route = express.Router();

route.post("/like/:id", isAuth, likePost);
route.post("/unlike/:id", isAuth, unlikePost);

module.exports = route;
