const express = require("express");
const passport = require("passport");
const authController = require("../controller/auth");

const router = express.Router();

// 🔹 Redirect to Google OAuth login
router.get("/google",authController.getGoogleAuthLink);

// 🔹 Google OAuth callback route
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth/failure" }),
    authController.googleAuthCallback
);

// 🔹 Logout route
router.get("/logout", authController.logout);

// 🔹 Authentication success response
router.get("/success", authController.authSuccess);

// 🔹 Authentication failure response
router.get("/failure", authController.authFailure);

module.exports = router;
