import mongoose from "mongoose";

const connectDB = async () => {
    
        // Establish a connection to MongoDB without deprecated options
        
        await mongoose.connect(process.env.MONGODB_URI);

        mongoose.connection.on('connected', () => {
            console.log('Database connected successfully.');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`Database connection error: ${err}`);
        });
    
    
};

export default connectDB;

