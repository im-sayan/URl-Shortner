const jwt = require('jsonwebtoken');
const { promisify } = require('util'); // Convert jwt.verify into a promise-based function
const TokenConfig = require('../config/AuthTokenConfig');
const User = require("../model/user");

module.exports.authenticateRequest = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({ msg: "Authentication Required" });
        }

        const accessToken = req.headers.authorization.split(' ')[1];
        console.log(accessToken,"accessToken");
        

        // Verify token synchronously
        const decodedToken = await promisify(jwt.verify)(accessToken, TokenConfig.jwtAccessToken.secret);

        // Find user by ID and validate token
        const user = await User.findOne({ email: decodedToken.email});
        console.log(user,"user");
        

        if (!user) {
            return res.status(401).json({ msg: "Authentication Failed" });
        }

        req.headers.userID = user._id;
        next();
        
    } catch (error) {
        console.error("Middleware Error:", error);

        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "Invalid or Expired Token" });
        }

        res.status(500).json({ message: "Server Error" });
    }
};
