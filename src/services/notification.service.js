import { Notification } from '../models/notification.models.js'

export const createNotification = async ({
    title,
    message,
    type,
    demand = null,
    department = null
}) => {
    try {
        return await Notification.create({
            title,
            message,
            type,
            demand,
            department
        })
    } catch (error) {
        console.error('Notification creation error:', error)
        return null
    }
}
