import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import departmentRoutes from './routes/department.routes.js'
import demandRoutes from './routes/demand.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import adminRoutes from './routes/admin.routes.js'

const app = express()

const rawCors = process.env.CORS_ORIGIN || '*'
const allowedOrigins = rawCors === '*' ? '*' : rawCors.split(',').map((item) => item.trim())

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins === '*') {
            return callback(null, true)
        }

        // Allow explicitly configured origins
        if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        // Automatically allow any Vercel deployment preview URL (*.vercel.app) and localhost
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) {
            return callback(null, true)
        }

        return callback(null, true) // Fallback allow in production to prevent unexpected API blocks
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With']
}))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(morgan('dev'))

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Demand management API is running'
    })
})

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'UP',
        timestamp: new Date().toISOString()
    })
})

app.use('/api/departments', departmentRoutes)
app.use('/api/demands', demandRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    })
})

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err)

    const statusCode = err.statusCode || 500

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error',
        errors: err.errors || []
    })
})

export default app
