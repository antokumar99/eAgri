const mongoose = require('mongoose');
require("dotenv").config();

const connectDB = async () => {
    try {
        // useNewUrlParser / useUnifiedTopology have had no effect since driver
        // v4 and only produced deprecation warnings on every boot.
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;