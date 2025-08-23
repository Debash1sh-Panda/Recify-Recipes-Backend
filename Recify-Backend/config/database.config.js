const mongoose = require("mongoose");

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Yahh 😎, Database Connected!");       
    } catch (error) {
        console.log("Ohh No 😢, Database Failed!", error);
        process.exit(1);
    }
}

module.exports = dbConnection;