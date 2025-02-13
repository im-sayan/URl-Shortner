const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
    userId: { type: String},
    shortUrlId: { type: String},
    deviceDetails:{ type: Object}
}, { timestamps: true });

module.exports = mongoose.model("Analytics", analyticsSchema);
