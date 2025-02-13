require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const bodyParser = require("body-parser");
const useragent = require("express-useragent");
const authRoutes = require("./routes/AuthRouter");
const apiRoutes = require("./routes/ApiRoutes");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // Ensure correct path

require("./config/passportConfig");

require("./config/redisConfig.js")
require("./config/config.js")

const app = express();

app.set("trust proxy", true);

// Middleware to parse user-agent
app.use(useragent.express());

// Security: Remove headers
app.disable("x-powered-by");
app.disable("Server");

// Middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS,HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,access-token,x-http-method-override,x-access-token,authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type,expire');
    next();
});
//app.use(responseInterceptor);

// Session setup
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

// Catch 404 errors
app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: "Internal Server Error" });
});

// Start server
const port = normalizePort(process.env.PORT || "3000");
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`),
    console.log(`📄 Swagger API Docs available at http://localhost:${port}/api-docs`);
});

function normalizePort(val) {
    const port = parseInt(val, 10);
    return isNaN(port) ? val : port >= 0 ? port : false;
}

module.exports = app;
