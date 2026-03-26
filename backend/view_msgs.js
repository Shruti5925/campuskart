const mongoose = require('mongoose');
const AdminMessage = require('./models/AdminMessage');
require('dotenv').config();

const viewMessages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const messages = await AdminMessage.find().sort({ createdAt: 1 });
        console.log(JSON.stringify(messages, null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
};

viewMessages();
