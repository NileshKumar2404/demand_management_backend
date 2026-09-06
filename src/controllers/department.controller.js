import { Department } from '../models/department.models.js'
import { asyncHandler } from '../utils/AsyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'

export const getDepartments = asyncHandler(async (req, res) => {
    try {
        const departments = await Department.find({ isActive: true })
            .sort({ name: 1 })
            .lean()

        return res.status(200).json(
            new ApiResponse(200, departments, 'Departments fetched successfully.')
        )
    } catch (error) {
        console.error(`Get departments error: ${error}`)
        throw new ApiError(500, 'Failed to get departments.')
    }
})

export const createDepartment = asyncHandler(async (req, res) => {
    const { name } = req.body

    if (!name || !name.trim()) {
        throw new ApiError(400, 'Department name is required.')
    }

    const normalizedName = name.trim()

    const existingDepartment = await Department.findOne({
        name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, $options: 'i' }
    })

    if (existingDepartment) {
        if (!existingDepartment.isActive) {
            existingDepartment.isActive = true
            existingDepartment.name = normalizedName
            await existingDepartment.save()

            return res.status(200).json(
                new ApiResponse(200, existingDepartment, 'Department reactivated successfully.')
            )
        }

        throw new ApiError(409, 'Department already exists.')
    }

    const department = await Department.create({
        name: normalizedName,
        isActive: true
    })

    return res.status(201).json(
        new ApiResponse(201, department, 'Department created successfully.')
    )
})
