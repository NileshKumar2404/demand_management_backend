import express from 'express'
import {
    createDemand,
    getDemands,
    getDemandById,
    assignDemand,
    acceptDemand,
    startDemand,
    holdDemand,
    completeDemand,
    closeDemand,
    getDashboard
} from '../controllers/demand.controller.js'

const router = express.Router()

router.post('/', createDemand)
router.get('/', getDemands)
router.get('/dashboard/:departmentId', getDashboard)
router.get('/:id', getDemandById)
router.patch('/:id/assign', assignDemand)
router.patch('/:id/accept', acceptDemand)
router.patch('/:id/start', startDemand)
router.patch('/:id/hold', holdDemand)
router.patch('/:id/complete', completeDemand)
router.patch('/:id/close', closeDemand)

export default router
