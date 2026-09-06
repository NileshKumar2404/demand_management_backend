import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },

    message: {
        type: String,
        required: true,
    },

    type: {
        type: String,
        enum: [
            "DEMAND_CREATED",
            "DEMAND_ASSIGNED",
            "STATUS_CHANGED",
            "DEMAND_COMPLETED",
            "DEMAND_OVERDUE",
        ],
        required: true,
    },

    demand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Demand",
        default: null,
    },

    isRead: {
        type: Boolean,
        default: false,
    },
},{timestamps: true});

export const Notification = mongoose.model("Notification", notificationSchema);