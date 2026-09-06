import dotenv from 'dotenv'

dotenv.config({
    path: './.env'
})

const { default: app } = await import('./app.js');
const { default: connectDB } = await import('./db/index.js')

connectDB()
.then(async() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on PORT: ${process.env.PORT || 3000}`);
    })
})

.catch((error) => {
    console.log(`!!! MongoDB connection failed: ${error}`);
    
})
