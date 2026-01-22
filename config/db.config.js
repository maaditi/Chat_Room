const mongoose = require('mongoose');

async function dbConnect(){
   await mongoose.connect(process.env.MONGODB_URI)
   console.log("Connected to MongoDB");   
}

dbConnect();
