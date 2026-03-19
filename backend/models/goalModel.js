import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    targetDate: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        default: "Savings"
    },
    status: {
        type: String,
        enum: ["active", "completed", "failed"],
        default: "active"
    }
}, {
    timestamps: true
});

const goalModel = mongoose.models.goal || mongoose.model("goal", goalSchema);
export default goalModel;
