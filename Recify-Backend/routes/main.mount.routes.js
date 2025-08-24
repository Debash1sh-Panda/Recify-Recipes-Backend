const authRoute = require("../routes/auth.routes.js");
const userRoute = require("../routes/user.routes.js");
const otpRoute = require("../routes/otp.routes.js");
const passwordRoute = require("../routes/password.routes.js");

const setupRoutes = (baseUrl, recify) => {
  recify.use(`${baseUrl}/auth`, authRoute);
  recify.use(`${baseUrl}/user`, userRoute);
  recify.use(`${baseUrl}/otp`, otpRoute);
  recify.use(`${baseUrl}/password`, passwordRoute);
};

module.exports = setupRoutes;
