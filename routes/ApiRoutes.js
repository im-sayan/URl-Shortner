const express = require("express");
const router = express.Router();
const shortnerController = require("../controller/shortner");
const urlShortenLimiter = require("../Middleware/ratelimit"); 
const AuthMiddleware = require("../Middleware/AuthMiddleware"); 


router.get("/", (req, res) => {
    res.json({ message: "Welcome to the URL Shortener API!" });
});


router.post("/shorten",AuthMiddleware.authenticateRequest,urlShortenLimiter, shortnerController.shortenUrl);
router.get("/analytics/overall",AuthMiddleware.authenticateRequest,shortnerController.OverAllAnalytics);
router.get("/shorten/:alias", shortnerController.RedirectToUrl);
router.get("/analytics/:alias", shortnerController.Analytics);
router.get("/analytics/topic/:topic", shortnerController.AnalyticsByTopic);


module.exports = router;
