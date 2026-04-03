const mongoose = require('mongoose');

const researchSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    link: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Agriculture', 'Farming Technology', 'Crop Science', 'Soil Science', 'Other']
    },
    publishedDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Research', researchSchema); 