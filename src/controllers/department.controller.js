import { Department } from '../models/department.models.js'
import { asyncHandler } from '../utils/AsyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'

export const getDepartments = asyncHandler(async(req, res) => {
    try {
        const departments = await Department.find({
            isActive: true
        }).sort({
            name: 1
        })

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            departments,
            'Departments fetched successfully.'
        ))
    } catch (error) {
        console.error(`Get departments error: ${error}`);
        throw new ApiError(500, 'Failed to get departments.')
    }
})

export const createDepartment = asyncHandler(async(req, res) => {
    try {
        
    } catch (error) {
        console.error(`Failed to create departments: ${error}`);
        throw new ApiError(500, 'Failed to create departments.')
    }
})