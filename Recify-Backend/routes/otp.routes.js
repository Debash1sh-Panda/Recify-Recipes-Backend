const express = require("express");
const { verifyOtpForEmailVerification, requestOtpForEmailVerification } = require("../controllers/otp.controllers");
const route = express.Router();

route.post("/request-otp", requestOtpForEmailVerification);
route.post("/verify-otp", verifyOtpForEmailVerification);

module.exports = route;
