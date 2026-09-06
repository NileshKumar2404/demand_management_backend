import mongoose from 'mongoose';

const demandSchema = new mongoose.Schema({
    demandNumber: {
        type: String,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    priority: {
        type: String,
        enum: ['P1', 'P2', 'P3', 'P4', 'P5'],
        required: true
    },
    createdBy: {
        type: String,
        required: true,
        trim: true
    },
    assignedTo: {
        type: String,
        default: null,
        trim: true
    },
    assignedAt: {
        type: Date,
        default: null
    },
    acceptedAt: {
        type: Date,
        default: null
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    closedAt: {
        type: Date,
        default: null
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: [
            'SUBMITTED',
            'ASSIGNED',
            'ACCEPTED',
            'IN_PROGRESS',
            'ON_HOLD',
            'COMPLETED',
            'CLOSED'
        ],
        default: 'SUBMITTED'
    },
    onHoldReason: {
        type: String,
        default: null
    },
    delayReason: {
        type: String,
        default: null
    },
    delayDescription: {
        type: String,
        default: null,
    },

    isOverdue: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export const Demand = mongoose.model('Demand', demandSchema);