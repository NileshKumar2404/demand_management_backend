import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

departmentSchema.index({ name: 1 }, { unique: true })

departmentSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v
        return ret
    }
})

export const Department = mongoose.model('Department', departmentSchema)
