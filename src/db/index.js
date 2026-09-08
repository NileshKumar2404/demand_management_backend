import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async (retries = 3, delay = 2000) => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is missing from environment variables')
    }

    const rawUri = process.env.MONGODB_URI.trim()
    let connectionString = rawUri

    try {
        const urlObj = new URL(rawUri)
        if (!urlObj.pathname || urlObj.pathname === '/') {
            urlObj.pathname = `/${DB_NAME}`
        }
        connectionString = urlObj.toString()
    } catch {
        const [base, query] = rawUri.split('?')
        const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
        const hasDb = /\/[^/]+$/.test(normalizedBase.replace(/^mongodb(\+srv)?:\/\//, ''))
        connectionString = hasDb
            ? rawUri
            : `${normalizedBase}/${DB_NAME}${query ? `?${query}` : ''}`
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const connectionInstance = await mongoose.connect(connectionString, {
                serverSelectionTimeoutMS: 10000,
            })
            console.log(`MongoDB connected successfully: ${connectionInstance.connection.host}`)
            return connectionInstance
        } catch (error) {
            console.error(`MongoDB connection attempt ${attempt} of ${retries} failed: ${error.message}`)
            if (attempt === retries) throw error
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }
}

export default connectDB

