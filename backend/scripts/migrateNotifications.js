const mongoose = require('mongoose');
require('dotenv').config();

async function migrateNotifications() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for migration...');

        const Notification = require('../models/Notification');
        
        // Find all notifications that use the old schema
        const legacyNotifs = await Notification.find({
            $or: [
                { recipient: { $exists: true } },
                { content: { $exists: true } },
                { read: { $exists: true } }
            ]
        });

        console.log(`Found ${legacyNotifs.length} legacy notifications to migrate.`);

        for (const notif of legacyNotifs) {
            const updates = {};
            const rawData = notif.toObject({ virtuals: false });

            // 1. Rename recipient to user
            if (rawData.recipient && !rawData.user) {
                updates.user = rawData.recipient;
            }

            // 2. Rename content to message
            if (rawData.content && !rawData.message) {
                updates.message = rawData.content;
            }

            // 3. Rename read to isRead
            if (rawData.read !== undefined && rawData.isRead === undefined) {
                updates.isRead = rawData.read;
            }

            // 4. Add default title if missing
            if (!rawData.title) {
                if (rawData.type === 'message') {
                    updates.title = 'New Message';
                } else {
                    updates.title = 'Notification';
                }
            }

            // Perform the update by removing old fields and adding new ones
            // We use updateOne with $unset and $set to be clean
            const unsetFields = {};
            if (rawData.recipient) unsetFields.recipient = "";
            if (rawData.content) unsetFields.content = "";
            if (rawData.read !== undefined) unsetFields.read = "";
            if (rawData.sender) unsetFields.sender = "";
            if (rawData.referenceId) unsetFields.referenceId = "";

            await Notification.updateOne(
                { _id: notif._id },
                { 
                    $set: updates,
                    $unset: unsetFields
                }
            );
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateNotifications();
