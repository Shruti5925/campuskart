const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Activity = require('./models/Activity');

dotenv.config();

const checkLogs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    
    const logs = await Activity.find().sort({ createdAt: -1 }).limit(10).populate('admin', 'firstName lastName');
    console.log(`Found ${logs.length} activity logs:`);
    logs.forEach(log => {
      console.log(`- [${log.createdAt.toISOString()}] ${log.admin?.firstName || 'System'} ${log.action} ${log.targetName} (${log.status})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkLogs();
