/**
 * Middleware: require authenticated session
 */
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Unauthorized", message: "Please sign in to continue" });
};

/**
 * Middleware: attach client IP (handles reverse-proxy X-Forwarded-For)
 */
const attachClientIp = (req, _res, next) => {
  req.clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress;
  next();
};

module.exports = { requireAuth, attachClientIp };
