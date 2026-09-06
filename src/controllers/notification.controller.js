import mongoose from 'mongoose'
import { Notification } from '../models/notification.models.js'
import { asyncHandler } from '../utils/AsyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'

export const getNotifications = asyncHandler(async (req, res) => {
    const { department, unreadOnly, limit = 50 } = req.query
    const filter = {}

    if (department) {
        if (!mongoose.isValidObjectId(department)) {
            throw new ApiError(400, 'Department ID is invalid.')
        }
        filter.department = department
    }

    if (unreadOnly === 'true') {
        filter.isRead = false
    }

    const pageSize = Math.min(100, Math.max(1, Number(limit) || 50))

    const notifications = await Notification.find(filter)
        .populate('demand', 'demandNumber title status priority')
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .limit(pageSize)

    const unreadCount = await Notification.countDocuments({
        ...filter,
        isRead: false
    })

    return res.status(200).json(
        new ApiResponse(200, {
            notifications,
            unreadCount
        }, 'Notifications fetched successfully.')
    )
})

export const markNotificationRead = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'Notification ID is invalid.')
    }

    const notification = await Notification.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true, runValidators: true }
    )

    if (!notification) {
        throw new ApiError(404, 'Notification not found.')
    }

    return res.status(200).json(
        new ApiResponse(200, notification, 'Notification marked as read.')
    )
})

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
    const { department } = req.body || {}
    const filter = { isRead: false }

    if (department) {
        if (!mongoose.isValidObjectId(department)) {
            throw new ApiError(400, 'Department ID is invalid.')
        }
        filter.department = department
    }

    const result = await Notification.updateMany(filter, {
        $set: { isRead: true }
    })

    return res.status(200).json(
        new ApiResponse(200, {
            modifiedCount: result.modifiedCount
        }, 'Notifications marked as read.')
    )
})
