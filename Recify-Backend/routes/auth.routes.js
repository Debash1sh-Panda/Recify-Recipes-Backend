const express = require("express");
const { signUp, signIn, logout } = require("../controllers/auth.controllers");
const { isAuth } = require("../middlewares/isAuth.middlewares");
const route = express.Router();

route.post("/sign-up", signUp);
route.post("/sign-in", signIn);
route.post("/logout", isAuth, logout);

module.exports = route;
