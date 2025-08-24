const express = require("express");
const { isAuth } = require("../middlewares/isAuth.middlewares.js");
const { resetPasswordRequest, resetPassword, updatePassword } = require("../controllers/password.controllers.js");
const router = express.Router();

router.post("/request-reset-password", resetPasswordRequest);
router.post("/reset-password/:resetToken", resetPassword);

router.put("/update-password", isAuth, updatePassword);

module.exports = router;
