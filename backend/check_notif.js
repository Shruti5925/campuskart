const mongoose = require('mongoose');
require('dotenv').config();
const Notification = require('./models/Notification');

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const lastNotif = await Notification.findOne({ type: 'rejection' }).sort({ createdAt: -1 });
    console.log('LATEST REJECTION NOTIFICATION:');
    console.log(JSON.stringify(lastNotif, null, 2));
    process.exit(0);
}

check();
