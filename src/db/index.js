import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async() => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing from environment variables')
        }

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB connected successfully: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error(`Database connection error: ${error}`);
        process.exit(1)
    }
}

export default connectDB;
