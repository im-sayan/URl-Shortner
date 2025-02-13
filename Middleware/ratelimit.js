const rateLimit = require("express-rate-limit");

const urlShortenLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Allow only 5 requests per minute per IP
    message: { error: "Too many requests. Please try again later." },
});

module.exports = urlShortenLimiter;
