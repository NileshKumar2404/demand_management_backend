import mongoose from "mongoose";

const demandHistorySchema = new mongoose.Schema({
    demand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Demand",
        required: true,
    },

    action: {
        type: String,
        enum: [
            "CREATED",
            "ASSIGNED",
            "ACCEPTED",
            "STARTED",
            "ON_HOLD",
            "RESUMED",
            "COMPLETED",
            "CLOSED",
        ],
        required: true,
    },

    performedBy: {
        type: String,
        required: true,
        trim: true,
    },

    previousStatus: {
        type: String,
        default: null,
    },

    newStatus: {
        type: String,
        default: null,
    },

    reason: {
        type: String,
        default: null,
    },

    notes: {
        type: String,
        default: null,
    },
},{timestamps: true});

export const DemandHistory = mongoose.model("DemandHistory", demandHistorySchema);