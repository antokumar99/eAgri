const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        match: [/^(\+?\d{1,3}|\d{1,4})?\d{6,14}$/, 'Please use a valid phone number.']
    },
    address:{
        houseNo: String,
        street: String,
        city: { 
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        postalCode: String
    },  
    photo: {
        type: String,
        default: '' // URL of the photo
    },
    farm: {
        title: {
            type: String,
        },
        details: {
            type: String,
        },
        experience: {
            type: Number, // Number of years of experience
            min: 0
        }
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationToken:String,
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);
