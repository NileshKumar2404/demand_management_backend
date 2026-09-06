import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is missing from environment variables')
    }

    const rawUri = process.env.MONGODB_URI.trim()
    const hasDatabaseName = /\/[^/]+(?:\?.*)?$/.test(rawUri.split('?')[0])
    const connectionString = hasDatabaseName ? rawUri : `${rawUri}/${DB_NAME}`

    const connectionInstance = await mongoose.connect(connectionString)

    console.log(`MongoDB connected successfully: ${connectionInstance.connection.host}`)

    return connectionInstance
}

export default connectDB
