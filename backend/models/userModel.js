import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    budgetLimit: {
        type: Number,
        default: 0
    },
    phoneNumber: {
        type: String,
        default: ""
    },
    currency: {
        type: String,
        default: "USD"
    },
    currencySymbol: {
        type: String,
        default: "$"
    },
    categoryBudgets: {
        type: Map,
        of: Number,
        default: {}
    },
    budgetAlerts: {
        type: [{
            month: String, // "YYYY-MM"
            category: String, // "Total" or category name
            threshold: Number // 80 or 100
        }],
        default: []
    },
    notifications: {
        type: [{
            title: String,
            message: String,
            type: { type: String, enum: ["info", "warning", "error", "success"], default: "info" },
            read: { type: Boolean, default: false },
            date: { type: Date, default: Date.now }
        }],
        default: []
    }
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;