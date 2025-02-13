require('dotenv')
const jwt = require('jsonwebtoken');
const User = require("../model/user"); // Import User model
const TokenConfig = require('../config/AuthTokenConfig');

exports.getGoogleAuthLink = (req, res) => {
    
    const googleAuthURL = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=profile email`;
    
    
    res.json({ login_url: googleAuthURL, message: "Open this Url in your browser" });
};


exports.googleAuthCallback = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication failed" });
    }
    res.redirect("/auth/success");
};

exports.authSuccess = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    console.log(req,"req");
    
    let accessToken = jwt.sign({ user_id: req.user._id, email: req.user.email }, TokenConfig.jwtAccessToken.secret, TokenConfig.jwtAccessToken.options);
    let refreshToken = jwt.sign({ user_id: req.user._id, email: req.user.email }, TokenConfig.jwtRefreshToken.secret, TokenConfig.jwtRefreshToken.options);
    
    res.json({
        message: "Authentication successful",
        Token : {
            accessToken: accessToken,
            refreshToken: refreshToken
        }
    });
};

exports.authFailure = (req, res) => {
    res.status(401).json({ message: "Authentication failed" });
};

exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
    });
};

