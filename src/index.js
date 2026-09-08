import dotenv from 'dotenv'

dotenv.config({
    path: './.env'
})

const { default: app } = await import('./app.js')
const { default: connectDB } = await import('./db/index.js')
const { Department } = await import('./models/department.models.js')

const PORT = Number(process.env.PORT) || 5000

try {
    await connectDB()

    const activeCount = await Department.countDocuments({ isActive: true })
    if (activeCount === 0) {
        const DEFAULT_DEPARTMENTS = ['IT', 'Subject Faculty', 'Accounts', 'HR', 'DTP']
        for (const name of DEFAULT_DEPARTMENTS) {
            await Department.findOneAndUpdate(
                { name },
                { name, isActive: true },
                { upsert: true, returnDocument: 'after' }
            )
        }
        console.log('✓ Default departments auto-seeded successfully on startup.')
    }

    app.listen(PORT, () => {
        console.log(`Server is running on PORT: ${PORT}`)
    })
} catch (error) {
    console.error(`!!! MongoDB connection failed: ${error}`)
    process.exit(1)
}
