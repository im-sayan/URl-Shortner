const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    name: { type: String, },
    email: { type: String, unique: true },
    avatar: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
