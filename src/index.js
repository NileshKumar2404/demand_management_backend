import dotenv from 'dotenv'

dotenv.config({
    path: './.env'
})

const { default: app } = await import('./app.js')
const { default: connectDB } = await import('./db/index.js')

const PORT = Number(process.env.PORT) || 3000

try {
    await connectDB()

    app.listen(PORT, () => {
        console.log(`Server is running on PORT: ${PORT}`)
    })
} catch (error) {
    console.error(`!!! MongoDB connection failed: ${error}`)
    process.exit(1)
}
