const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
    createdBy: { type: String, required: true },
    longUrl: { type: String, required: true },
    shortUrl: { type: String, required: true, unique: true },
    customAlias: { type: String, unique: true, sparse: true }, // Custom alias (optional)
    topic: { type: String, default: "general" }, // Optional topic
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ShortUrl", urlSchema);
