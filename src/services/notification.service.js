import { Notification } from '../models/notification.models.js'
import { sseService } from './sse.service.js'

export const createNotification = async ({
    title,
    message,
    type,
    demand = null,
    department = null
}) => {
    try {
        const notification = await Notification.create({
            title,
            message,
            type,
            demand,
            department
        })

        if (notification) {
            sseService.broadcastNotification(notification)
        }

        return notification
    } catch (error) {
        console.error('Notification creation error:', error)
        return null
    }
}

