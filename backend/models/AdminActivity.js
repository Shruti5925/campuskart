const mongoose = require("mongoose");

const adminActivitySchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    action: {
        type: String,
        required: true // e.g., "APPROVED", "REJECTED", "FLAGGED", "UNFLAGGED", "VERIFIED", "SUSPENDED", "REACTIVATED"
    },
    targetType: {
        type: String,
        required: true // "Product" or "User"
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    targetName: {
        type: String,
        required: true // Product Title or User Name
    },
    details: {
        type: String
    },
    status: {
        type: String,
        enum: ["SUCCESSFUL", "ENFORCEMENT", "CLOSED", "INFO"],
        default: "SUCCESSFUL"
    }
}, { 
    timestamps: true,
    collection: 'admin_activities' // Explicitly set as requested
});

module.exports = mongoose.model("AdminActivity", adminActivitySchema);
