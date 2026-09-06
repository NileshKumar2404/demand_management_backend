import mongoose from 'mongoose'

const demandHistorySchema = new mongoose.Schema({
    demand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Demand',
        required: true,
        index: true
    },
    action: {
        type: String,
        enum: [
            'CREATED',
            'ASSIGNED',
            'ACCEPTED',
            'STARTED',
            'ON_HOLD',
            'RESUMED',
            'COMPLETED',
            'CLOSED'
        ],
        required: true
    },
    performedBy: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    previousStatus: {
        type: String,
        default: null
    },
    newStatus: {
        type: String,
        default: null
    },
    reason: {
        type: String,
        default: null,
        trim: true,
        maxlength: 2000
    },
    notes: {
        type: String,
        default: null,
        trim: true,
        maxlength: 2000
    }
}, { timestamps: true })

demandHistorySchema.index({ demand: 1, createdAt: 1 })

demandHistorySchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v
        return ret
    }
})

export const DemandHistory = mongoose.model('DemandHistory', demandHistorySchema)
