const authRoute = require("../routes/auth.routes.js");
const userRoute = require("../routes/user.routes.js");
const otpRoute = require("../routes/otp.routes.js");

const setupRoutes = (baseUrl, recify) => {
  recify.use(`${baseUrl}/auth`, authRoute);
  recify.use(`${baseUrl}/user`, userRoute);
  recify.use(`${baseUrl}/otp`, otpRoute);
};

module.exports = setupRoutes;
