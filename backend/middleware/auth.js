const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Cookie options shared by set + clear so they always match.
const cookieOptions = {
  httpOnly: true,
  // Cross-site cookie is only viable over https; sameSite 'none' requires secure.
  sameSite: env.isProd ? "none" : "lax",
  secure: env.isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const authenticate = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Must run AFTER authenticate. Blocks anyone whose token role isn't "admin".
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};

module.exports = { authenticate, requireAdmin, cookieOptions };
