import { Department } from '../models/department.models.js'
import { asyncHandler } from '../utils/AsyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const DEFAULT_DEPARTMENTS = [
    'IT',
    'Subject Faculty',
    'Accounts',
    'HR',
    'DTP'
]

export const seedDefaultDepartments = asyncHandler(async (req, res) => {
    const results = []

    for (const name of DEFAULT_DEPARTMENTS) {
        const existing = await Department.findOne({ name })

        if (existing) {
            if (!existing.isActive) {
                existing.isActive = true
                await existing.save()
            }
            results.push(existing)
            continue
        }

        results.push(await Department.create({
            name,
            isActive: true
        }))
    }

    return res.status(200).json(
        new ApiResponse(200, results, 'Default departments seeded successfully.')
    )
})
