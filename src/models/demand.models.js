import mongoose from 'mongoose'

const demandSchema = new mongoose.Schema({
    demandNumber: {
        type: String,
        unique: true,
        index: true,
        immutable: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 5000
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
        index: true
    },
    priority: {
        type: String,
        enum: ['P1', 'P2', 'P3', 'P4', 'P5'],
        required: true,
        index: true
    },
    createdBy: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    assignedTo: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100
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
        required: true,
        index: true
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
        default: 'SUBMITTED',
        index: true
    },
    onHoldReason: {
        type: String,
        default: null,
        trim: true,
        maxlength: 2000
    },
    delayReason: {
        type: String,
        default: null,
        trim: true,
        maxlength: 200
    },
    delayDescription: {
        type: String,
        default: null,
        trim: true,
        maxlength: 2000
    },
    isOverdue: {
        type: Boolean,
        default: false,
        index: true
    }
}, { timestamps: true })

demandSchema.index({ department: 1, status: 1, createdAt: -1 })
demandSchema.index({ department: 1, dueDate: 1 })
demandSchema.index({ department: 1, priority: 1, createdAt: -1 })

demandSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v
        return ret
    }
})

export const Demand = mongoose.model('Demand', demandSchema)
