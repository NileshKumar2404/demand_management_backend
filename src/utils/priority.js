import { ApiError } from '../utils/ApiError.js'

export const priority_SLA = {
    P1: 3,
    P2: 7,
    P3: 15,
    P4: 30,
    P5: 60
}

export const calculateDate = (createdAt, priority) => {
    const days = priority_SLA[priority]

    if (!days) {
        throw new ApiError(
            400,
            'Invalid priority.'
        )
    }

    const dueDate = new Date(createdAt)

    dueDate.setDate(dueDate.getDate() + days)

    return dueDate;
}