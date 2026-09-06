import { DemandHistory } from '../models/demandHIstory.models.js'

export const createHistory = async ({
    demand,
    action,
    performedBy,
    previousStatus = null,
    newStatus = null,
    reason = null,
    notes = null
}) => {
    return DemandHistory.create({
        demand,
        action,
        performedBy: performedBy.trim(),
        previousStatus,
        newStatus,
        reason: reason?.trim() || null,
        notes: notes?.trim() || null
    })
}

export const isDemandOverdue = (demand, now = new Date()) => {
    if (['COMPLETED', 'CLOSED'].includes(demand.status)) {
        return false
    }

    return now.getTime() > new Date(demand.dueDate).getTime()
}

export const getSlaState = (demand, now = new Date()) => {
    if (['COMPLETED', 'CLOSED'].includes(demand.status)) {
        if (!demand.completedAt) {
            return { state: 'COMPLETED', overdue: false, remainingMs: 0 }
        }

        const completedAt = new Date(demand.completedAt)
        const dueDate = new Date(demand.dueDate)
        const overdueMs = Math.max(0, completedAt.getTime() - dueDate.getTime())

        return {
            state: overdueMs > 0 ? 'BREACHED' : 'COMPLETED_WITHIN_SLA',
            overdue: overdueMs > 0,
            remainingMs: 0,
            overdueMs
        }
    }

    const dueTime = new Date(demand.dueDate).getTime()
    const nowTime = now.getTime()
    const remainingMs = dueTime - nowTime

    return {
        state: remainingMs <= 0 ? 'OVERDUE' : 'OPEN',
        overdue: remainingMs <= 0,
        remainingMs: Math.max(0, remainingMs),
        overdueMs: Math.max(0, -remainingMs)
    }
}
