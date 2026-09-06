import { Counter } from '../models/counter.models.js'

export const generateDemandNumber = async() => {
    const year = new Date().getFullYear()

    const counter = await Counter.findOneAndUpdate(
        {
            name: `demand-${year}`
        },
        {
            $inc: {
                sequence: 1
            }
        },
        {
            new: true,
            upsert: true
        }
    )

    return `DM-${year}-${String(counter.sequence).padStart(4, '0')}`
}