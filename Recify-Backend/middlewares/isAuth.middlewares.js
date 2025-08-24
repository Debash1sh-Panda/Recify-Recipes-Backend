const jwt = require("jsonwebtoken");
const logger = require("winston");

exports.isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.Authorization || req.headers.authorization;
    const token =
      req.cookies.accessToken ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Access token missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Invalid or tampered token.",
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Handle token-specific errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Access token has expired.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Invalid token.",
      });
    }

    // Log unexpected errors
    logger.error("Error in isAuthenticated middleware:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
};
