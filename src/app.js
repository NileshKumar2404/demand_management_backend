import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Demand management API is running'
    })
})

export default app