exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.Authorization || req.headers.authorization;
    const token =
      req.cookies.accessToken ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null);

    if (!token) {
      req.user = null; // guest
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded || !decoded.id) {
      req.user = null; // treat invalid token as guest
      return next();
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // For optionalAuth, just ignore token errors and treat as guest
    req.user = null;
    next();
  }
};
