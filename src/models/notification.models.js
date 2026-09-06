import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    type: {
        type: String,
        enum: [
            'DEMAND_CREATED',
            'DEMAND_ASSIGNED',
            'STATUS_CHANGED',
            'DEMAND_COMPLETED',
            'DEMAND_OVERDUE'
        ],
        required: true,
        index: true
    },
    demand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Demand',
        default: null,
        index: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null,
        index: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    }
}, { timestamps: true })

notificationSchema.index({ createdAt: -1 })
notificationSchema.index({ department: 1, createdAt: -1 })

notificationSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v
        return ret
    }
})

export const Notification = mongoose.model('Notification', notificationSchema)
