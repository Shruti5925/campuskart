const mongoose = require('mongoose');
const AdminMessage = require('./models/AdminMessage');
require('dotenv').config();

const deleteDuplicate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await AdminMessage.deleteOne({ _id: "69c501d486e28630fd94deff" });
        console.log(`Deleted ${result.deletedCount} message(s)`);
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
};

deleteDuplicate();
