const express = require("express");
const fetch = require("node-fetch");
const { URL } = require("url");

const router = express.Router();

// Only images we actually serve may pass through — blocks SSRF probing of
// internal/private networks via an attacker-supplied url param.
const IMAGE_PROXY_ALLOWED_HOSTS = new Set([
  "spoonacular.com",
  "media-sp00.spoonacular.com",
  "img.spoonacular.com",
  "images.unsplash.com",
]);

router.get("/image-proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });
  let target;
  try {
    target = new URL(decodeURIComponent(url));
  } catch {
    return res.status(400).json({ error: "Invalid url" });
  }
  if (target.protocol !== "https:" || !IMAGE_PROXY_ALLOWED_HOSTS.has(target.hostname)) {
    return res.status(403).json({ error: "Host not allowed" });
  }
  try {
    const response = await fetch(target.toString());
    if (!response.ok) return res.status(response.status).end();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    response.body.pipe(res);
  } catch (err) {
    res.status(500).end();
  }
});

module.exports = router;
