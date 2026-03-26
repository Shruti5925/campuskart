const mongoose = require('mongoose');
const AdminMessage = require('./models/AdminMessage');
require('dotenv').config();

const findDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const allMessages = await AdminMessage.find().sort({ createdAt: 1 });
        console.log(`Analyzing ${allMessages.length} messages...`);

        const duplicates = [];
        for (let i = 0; i < allMessages.length; i++) {
            for (let j = i + 1; j < allMessages.length; j++) {
                const msgA = allMessages[i];
                const msgB = allMessages[j];

                const timeDiff = Math.abs(msgA.createdAt - msgB.createdAt);
                
                if (
                    msgA.conversationId.toString() === msgB.conversationId.toString() &&
                    msgA.sender.toString() === msgB.sender.toString() &&
                    msgA.content === msgB.content &&
                    timeDiff < 2000 // 2 seconds
                ) {
                    duplicates.push({ msgA, msgB });
                }
            }
        }

        console.log(`Found ${duplicates.length} potential duplicate pairs`);
        for (const pair of duplicates) {
            console.log('Duplicate pair:');
            console.log(`  ID 1: ${pair.msgA._id} (${pair.msgA.createdAt.toISOString()})`);
            console.log(`  ID 2: ${pair.msgB._id} (${pair.msgB.createdAt.toISOString()})`);
            console.log(`  Content: "${pair.msgA.content}"`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Diagnostic failed:', err);
        process.exit(1);
    }
};

findDuplicates();
