const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        
    },
    email: {
        type: String,
        
        unique: true
    },
    displayName: {
        type: String,
       
    },
    image: {
        type: String,
    },
    socketId: {
        type: String,
        default: ''
    }
},
    {
        timestamps: true
    }
);

const User = mongoose.model("user" , userSchema);
