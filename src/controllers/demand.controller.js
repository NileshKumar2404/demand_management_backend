import mongoose from 'mongoose'
import { Demand } from '../models/demand.models.js'
import { Department } from '../models/department.models.js'
import { DemandHistory } from '../models/demandHIstory.models.js'
import { asyncHandler } from '../utils/AsyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { calculateDate } from '../utils/priority.js'
import { generateDemandNumber } from '../utils/demandNumber.js'
import { createHistory, getSlaState, isDemandOverdue } from '../services/demand.service.js'
import { createNotification } from '../services/notification.service.js'

const VALID_PRIORITIES = new Set(['P1', 'P2', 'P3', 'P4', 'P5'])
const TERMINAL_STATUSES = new Set(['COMPLETED', 'CLOSED'])

const ensureObjectId = (value, fieldName) => {
    if (!mongoose.isValidObjectId(value)) {
        throw new ApiError(400, `${fieldName} is invalid.`)
    }
}

const requiredString = (value, fieldName, maxLength = 2000) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new ApiError(400, `${fieldName} is required.`)
    }

    const normalized = value.trim()

    if (normalized.length > maxLength) {
        throw new ApiError(400, `${fieldName} must be ${maxLength} characters or fewer.`)
    }

    return normalized
}

const enrichDemand = (demandDoc, now = new Date()) => {
    const demand = demandDoc.toObject ? demandDoc.toObject() : { ...demandDoc }
    const sla = getSlaState(demand, now)

    return {
        ...demand,
        isOverdue: sla.overdue,
        slaState: sla.state,
        remainingMs: sla.remainingMs,
        overdueMs: sla.overdueMs || 0
    }
}

const getDemandOrThrow = async (id) => {
    ensureObjectId(id, 'Demand ID')

    const demand = await Demand.findById(id)

    if (!demand) {
        throw new ApiError(404, 'Demand not found.')
    }

    return demand
}

const ensureActor = (performedBy) => requiredString(performedBy, 'performedBy', 100)

const ensureStatus = (demand, allowedStatuses, message) => {
    if (!allowedStatuses.includes(demand.status)) {
        throw new ApiError(400, message)
    }
}

export const createDemand = asyncHandler(async (req, res) => {
    const title = requiredString(req.body.title, 'title', 200)
    const description = requiredString(req.body.description, 'description', 5000)
    const createdBy = requiredString(req.body.createdBy, 'createdBy', 100)
    const { department, priority } = req.body

    ensureObjectId(department, 'Department ID')

    if (!VALID_PRIORITIES.has(priority)) {
        throw new ApiError(400, 'Priority must be one of P1, P2, P3, P4 or P5.')
    }

    const departmentDoc = await Department.findOne({
        _id: department,
        isActive: true
    }).lean()

    if (!departmentDoc) {
        throw new ApiError(404, 'Department not found.')
    }

    const createdAt = new Date()
    const dueDate = calculateDate(createdAt, priority)
    const demandNumber = await generateDemandNumber()

    const demand = await Demand.create({
        demandNumber,
        title,
        description,
        department,
        priority,
        createdBy,
        createdAt,
        dueDate,
        status: 'SUBMITTED'
    })

    await createHistory({
        demand: demand._id,
        action: 'CREATED',
        performedBy: createdBy,
        newStatus: 'SUBMITTED'
    })

    await createNotification({
        title: 'New Demand Created',
        message: `${demandNumber} has been created for ${departmentDoc.name}.`,
        type: 'DEMAND_CREATED',
        demand: demand._id,
        department: department._id || department
    })

    const result = await Demand.findById(demand._id).populate('department', 'name')

    return res.status(201).json(
        new ApiResponse(201, enrichDemand(result), 'Demand created successfully.')
    )
})

export const getDemands = asyncHandler(async (req, res) => {
    const {
        department,
        status,
        priority,
        search,
        overdue,
        assignedTo,
        createdBy,
        fromDate,
        toDate,
        page = 1,
        limit = 20
    } = req.query

    const pageNumber = Math.max(1, Number(page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20))
    const filter = {}

    if (department) {
        ensureObjectId(department, 'Department ID')
        filter.department = department
    }

    if (status) {
        const statuses = String(status).split(',').map((value) => value.trim()).filter(Boolean)
        const allowed = ['SUBMITTED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED']
        if (statuses.some((value) => !allowed.includes(value))) {
            throw new ApiError(400, 'Invalid status filter.')
        }
        filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses }
    }

    if (priority) {
        const priorities = String(priority).split(',').map((value) => value.trim()).filter(Boolean)
        if (priorities.some((value) => !VALID_PRIORITIES.has(value))) {
            throw new ApiError(400, 'Invalid priority filter.')
        }
        filter.priority = priorities.length === 1 ? priorities[0] : { $in: priorities }
    }

    if (assignedTo) {
        filter.assignedTo = { $regex: String(assignedTo).trim(), $options: 'i' }
    }

    if (createdBy) {
        filter.createdBy = { $regex: String(createdBy).trim(), $options: 'i' }
    }

    if (search) {
        const searchTerm = String(search).trim()
        filter.$or = [
            { demandNumber: { $regex: searchTerm, $options: 'i' } },
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { createdBy: { $regex: searchTerm, $options: 'i' } },
            { assignedTo: { $regex: searchTerm, $options: 'i' } }
        ]
    }

    if (fromDate || toDate) {
        filter.createdAt = {}
        if (fromDate) {
            const start = new Date(fromDate)
            if (Number.isNaN(start.getTime())) throw new ApiError(400, 'Invalid fromDate.')
            start.setHours(0, 0, 0, 0)
            filter.createdAt.$gte = start
        }
        if (toDate) {
            const end = new Date(toDate)
            if (Number.isNaN(end.getTime())) throw new ApiError(400, 'Invalid toDate.')
            end.setHours(23, 59, 59, 999)
            filter.createdAt.$lte = end
        }
    }

    const now = new Date()

    if (overdue === 'true') {
        filter.dueDate = { $lt: now }
        filter.status = { $nin: ['COMPLETED', 'CLOSED'] }
    }

    const [demands, total] = await Promise.all([
        Demand.find(filter)
            .populate('department', 'name')
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize),
        Demand.countDocuments(filter)
    ])

    const data = demands.map((demand) => enrichDemand(demand, now))

    return res.status(200).json(
        new ApiResponse(200, {
            demands: data,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        }, 'Demands fetched successfully.')
    )
})

export const getDemandById = asyncHandler(async (req, res) => {
    const demand = await getDemandOrThrow(req.params.id)

    const [populatedDemand, history] = await Promise.all([
        Demand.findById(demand._id).populate('department', 'name'),
        DemandHistory.find({ demand: demand._id }).sort({ createdAt: 1 })
    ])

    return res.status(200).json(
        new ApiResponse(200, {
            demand: enrichDemand(populatedDemand),
            history
        }, 'Demand fetched successfully.')
    )
})

export const assignDemand = asyncHandler(async (req, res) => {
    const demand = await getDemandOrThrow(req.params.id)
    const assignedTo = requiredString(req.body.assignedTo, 'assignedTo', 100)
    const performedBy = ensureActor(req.body.performedBy)

    ensureStatus(demand, ['SUBMITTED', 'ASSIGNED'], 'Only submitted or already assigned demands can be assigned.')

    if (demand.status === 'CLOSED' || demand.status === 'COMPLETED') {
        throw new ApiError(400, 'Completed demands cannot be assigned.')
    }

    const previousStatus = demand.status
    const previousAssignee = demand.assignedTo

    demand.assignedTo = assignedTo
    demand.assignedAt = demand.assignedAt || new Date()
    if (demand.status === 'SUBMITTED') {
        demand.status = 'ASSIGNED'
    }

    await demand.save()

    await createHistory({
        demand: demand._id,
        action: 'ASSIGNED',
        performedBy,
        previousStatus,
        newStatus: demand.status,
        notes: previousAssignee ? `Reassigned from ${previousAssignee} to ${assignedTo}.` : `Assigned to ${assignedTo}.`
    })

    await createNotification({
        title: 'Demand Assigned',
        message: `${demand.demandNumber} has been assigned to ${assignedTo}.`,
        type: 'DEMAND_ASSIGNED',
        demand: demand._id,
        department: demand.department
    })

    return res.status(200).json(
        new ApiResponse(200, enrichDemand(demand), 'Demand assigned successfully.')
    )
})

export const acceptDemand = asyncHandler(async (req, res) => {
    const demand = await getDemandOrThrow(req.params.id)
    const performedBy = ensureActor(req.body.performedBy)

    ensureStatus(demand, ['ASSIGNED'], 'Only assigned demands can be accepted.')

    const previousStatus = demand.status
    demand.acceptedAt = new Date()
    demand.status = 'ACCEPTED'

    await demand.save()

    await createHistory({
        demand: demand._id,
        action: 'ACCEPTED',
        performedBy,
        previousStatus,
        newStatus: 'ACCEPTED'
    })

    await createNotification({
        title: 'Demand Accepted',
        message: `${demand.demandNumber} has been accepted.`,
        type: 'STATUS_CHANGED',
        demand: demand._id,
        department: demand.department
    })

    return res.status(200).json(
        new ApiResponse(200, enrichDemand(demand), 'Demand accepted successfully.')
    )
})

export const startDemand = asyncHandler(async (req, res) => {
    const demand = await getDemandOrThrow(req.params.id)
    const performedBy = ensureActor(req.body.performedBy)

    ensureStatus(demand, ['ACCEPTED', 'ON_HOLD'], 'Only accepted or on-hold demands can be started/resumed.')

    const previousStatus = demand.status
    const action = previousStatus === 'ON_HOLD' ? 'RESUMED' : 'STARTED'

    demand.startedAt = demand.startedAt || new Date()
    demand.status = 'IN_PROGRESS'
    demand.onHoldReason = null

    await demand.save()

    await createHistory({
        demand: demand._id,
        action,
        performedBy,
        previousStatus,
        newStatus: 'IN_PROGRESS'
    })

    await createNotification({
        title: 'Demand Status Updated',
        message: `${demand.demandNumber} is now in progress.`,
        type: 'STATUS_CHANGED',
        demand: demand._id,
        department: demand.department
    })

    return res.status(200).json(
        new ApiResponse(200, enrichDemand(demand), action === 'RESUMED' ? 'Demand resumed successfully.' : 'Demand started successfully.')
    )
})

export const holdDemand = asyncHandler(async (req, res) => {
    const demand = await getDemandOrThrow(req.params.id)
    const performedBy = ensureActor(req.body.performedBy)
    const reason = requiredString(req.body.reason, 'reason', 2000)

    ensureStatus(demand, ['IN_PROGRESS'], 'Only in-progress demands can be put on hold.')

    const previousStatus = demand.status
    demand.status = 'ON_HOLD'
    demand.onHoldReason = reason

    await demand.save()

    await createHistory({
        demand: demand._id,
        action: 'ON_HOLD',
        performedBy,
        previousStatus,
        newStatus: 'ON_HOLD',
        reason
    })

    await createNotification({
        title: 'Demand Put On Hold',
        message: `${demand.demandNumber} has been put on hold.`,
        type: 'STATUS_CHANGED',
        demand: demand._id,
        department: demand.department
    })

    return res.status(200).json(
        new ApiResponse(200, enrichDemand(demand), 'Demand put on hold successfully.')
    )
})

export const completeDemand = asyncHandler(async (req, res) => {
    const demand = await getDemandOrThrow(req.params.id)
    const performedBy = ensureActor(req.body.performedBy)
    const delayReason = req.body.delayReason
    const delayDescription = req.body.delayDescription

    ensureStatus(demand, ['IN_PROGRESS', 'ON_HOLD'], 'Only in-progress or on-hold demands can be completed.')

    const completionTime = new Date()
    const isOverdue = completionTime.getTime() > new Date(demand.dueDate).getTime()

    if (isOverdue) {
        requiredString(delayReason, 'delayReason', 200)
        if (delayDescription != null && typeof delayDescription !== 'string') {
            throw new ApiError(400, 'delayDescription must be a string.')
        }
    }

    const previousStatus = demand.status
    demand.completedAt = completionTime
    demand.status = 'COMPLETED'
    demand.isOverdue = isOverdue
    demand.delayReason = isOverdue ? delayReason.trim() : null
    demand.delayDescription = isOverdue ? (delayDescription?.trim() || null) : null
    demand.onHoldReason = null

    await demand.save()

    await createHistory({
        demand: demand._id,
        action: 'COMPLETED',
        performedBy,
        previousStatus,
        newStatus: 'COMPLETED',
        reason: isOverdue ? delayReason : null,
        notes: isOverdue ? (delayDescription || 'Completed after SLA deadline.') : 'Completed within SLA.'
    })

    await createNotification({
        title: 'Demand Completed',
        message: isOverdue
            ? `${demand.demandNumber} was completed after its SLA deadline.`
            : `${demand.demandNumber} has been completed.`,
        type: 'DEMAND_COMPLETED',
        demand: demand._id,
        department: demand.department
    })

    return res.status(200).json(
        new ApiResponse(200, enrichDemand(demand), isOverdue ? 'Demand completed with delay.' : 'Demand completed successfully.')
    )
})

export const closeDemand = asyncHandler(async (req, res) => {
    const demand = await getDemandOrThrow(req.params.id)
    const performedBy = ensureActor(req.body.performedBy)

    ensureStatus(demand, ['COMPLETED'], 'Only completed demands can be closed.')

    const previousStatus = demand.status
    demand.status = 'CLOSED'
    demand.closedAt = new Date()

    await demand.save()

    await createHistory({
        demand: demand._id,
        action: 'CLOSED',
        performedBy,
        previousStatus,
        newStatus: 'CLOSED'
    })

    await createNotification({
        title: 'Demand Closed',
        message: `${demand.demandNumber} has been closed.`,
        type: 'STATUS_CHANGED',
        demand: demand._id,
        department: demand.department
    })

    return res.status(200).json(
        new ApiResponse(200, enrichDemand(demand), 'Demand closed successfully.')
    )
})

export const getDashboard = asyncHandler(async (req, res) => {
    const { departmentId } = req.params
    ensureObjectId(departmentId, 'Department ID')

    const department = await Department.findOne({
        _id: departmentId,
        isActive: true
    }).lean()

    if (!department) {
        throw new ApiError(404, 'Department not found.')
    }

    const now = new Date()

    const [
        total,
        submitted,
        assigned,
        accepted,
        inProgress,
        onHold,
        completed,
        closed,
        overdue,
        priorityCounts,
        recentDemands,
        avgResolution
    ] = await Promise.all([
        Demand.countDocuments({ department: departmentId }),
        Demand.countDocuments({ department: departmentId, status: 'SUBMITTED' }),
        Demand.countDocuments({ department: departmentId, status: 'ASSIGNED' }),
        Demand.countDocuments({ department: departmentId, status: 'ACCEPTED' }),
        Demand.countDocuments({ department: departmentId, status: 'IN_PROGRESS' }),
        Demand.countDocuments({ department: departmentId, status: 'ON_HOLD' }),
        Demand.countDocuments({ department: departmentId, status: 'COMPLETED' }),
        Demand.countDocuments({ department: departmentId, status: 'CLOSED' }),
        Demand.countDocuments({
            department: departmentId,
            status: { $nin: ['COMPLETED', 'CLOSED'] },
            dueDate: { $lt: now }
        }),
        Demand.aggregate([
            { $match: { department: new mongoose.Types.ObjectId(departmentId) } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        Demand.find({ department: departmentId })
            .populate('department', 'name')
            .sort({ createdAt: -1 })
            .limit(10),
        Demand.aggregate([
            {
                $match: {
                    department: new mongoose.Types.ObjectId(departmentId),
                    completedAt: { $ne: null }
                }
            },
            {
                $project: {
                    resolutionMs: { $subtract: ['$completedAt', '$createdAt'] }
                }
            },
            {
                $group: {
                    _id: null,
                    averageResolutionMs: { $avg: '$resolutionMs' }
                }
            }
        ])
    ])

    const prioritySummary = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 }
    for (const item of priorityCounts) {
        prioritySummary[item._id] = item.count
    }

    const resolutionMs = avgResolution[0]?.averageResolutionMs || 0

    return res.status(200).json(
        new ApiResponse(200, {
            department: {
                id: department._id,
                name: department.name
            },
            counts: {
                total,
                submitted,
                assigned,
                accepted,
                inProgress,
                onHold,
                completed,
                closed,
                overdue
            },
            priorityCounts: prioritySummary,
            averageResolutionMs: resolutionMs,
            recentDemands: recentDemands.map((demand) => enrichDemand(demand, now))
        }, 'Dashboard fetched successfully.')
    )
})
