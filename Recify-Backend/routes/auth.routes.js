const express = require("express");
const { signUp, signIn, logout } = require("../controllers/auth.controllers");
const route = express.Router();

route.post("/sign-up", signUp);
route.post("/sign-in", signIn);
route.post("/logout", logout);

module.exports = route;
