import express from 'express'
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    streamNotifications
} from '../controllers/notification.controller.js'

const router = express.Router()

router.get('/stream', streamNotifications)
router.get('/', getNotifications)
router.patch('/:id/read', markNotificationRead)
router.patch('/read-all', markAllNotificationsRead)


export default router
