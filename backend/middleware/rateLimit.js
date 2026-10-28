const rateLimit = require("express-rate-limit");
const env = require("../config/env");

// Every limiter is skipped under NODE_ENV=test so the suite isn't throttled.
const skipInTest = () => env.isTest;

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Search limit reached, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

// AI calls cost real quota — keep them well under the general limit.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  message: { error: "You are using the kitchen too fast — try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

module.exports = { generalLimiter, authLimiter, searchLimiter, aiLimiter };
