import express from 'express'
import { seedDefaultDepartments } from '../controllers/seed.controller.js'

const router = express.Router()

router.post('/seed-departments', seedDefaultDepartments)

export default router
