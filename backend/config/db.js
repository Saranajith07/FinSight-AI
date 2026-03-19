import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        // We use process.env.MONGO_URI to keep your credentials secret
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`DB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // This stops the server if the DB doesn't connect
    }
}