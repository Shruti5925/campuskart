const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getDayRange = (daysAhead) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const start = new Date(date.setHours(0, 0, 0, 0));
  const end = new Date(date.setHours(23, 59, 59, 999));
  return { start, end };
};

const runExpiryCheck = async () => {
  console.log('[ExpiryScheduler] Running account expiry check...');
  const now = new Date();
  
  try {
    // 1. Mark expired accounts
    const expiredUsers = await User.find({
      role: 'student',
      accountStatus: 'active',
      accountExpiryDate: { $lte: now }
    });
    
    if (expiredUsers.length > 0) {
      console.log(`[ExpiryScheduler] Found ${expiredUsers.length} active students past their expiry date. Updating...`);
      for (const user of expiredUsers) {
        user.accountStatus = 'expired';
        await user.save();
        
        // Save final expiry notification
        const expiryNotification = new Notification({
          user: user._id,
          type: "info",
          title: "Account Expired ❌",
          message: "Your CampusKart account has expired as your graduation year has passed.",
          link: "/profile"
        });
        await expiryNotification.save();
        console.log(`[ExpiryScheduler] Expired student account and notified: ${user.email}`);
      }
    } else {
      console.log('[ExpiryScheduler] No new accounts to expire today.');
    }

    // 2. Send reminders (30 days, 7 days, 1 day)
    const findAndNotify = async (daysAhead, title, messageTemplate) => {
      const { start, end } = getDayRange(daysAhead);
      const users = await User.find({
        role: 'student',
        accountStatus: 'active',
        accountExpiryDate: { $gte: start, $lte: end }
      });
      
      for (const user of users) {
        // Check if notification already exists to avoid duplicates
        const existingNotif = await Notification.findOne({
          user: user._id,
          title: title
        });
        
        if (!existingNotif) {
          const formattedDate = `31 July ${user.graduationYear}`;
          const message = messageTemplate.replace("[expiry date]", formattedDate);
          const notification = new Notification({
            user: user._id,
            type: "info",
            title: title,
            message: message,
            link: "/profile"
          });
          await notification.save();
          console.log(`[ExpiryScheduler] Sent ${daysAhead}-day reminder to ${user.email}`);
        }
      }
    };

    // 30 days reminder
    await findAndNotify(
      30,
      "Account Expiry Reminder (30 Days)",
      "Your CampusKart account will expire on [expiry date]. Please complete any ongoing transactions."
    );

    // 7 days reminder
    await findAndNotify(
      7,
      "Account Expiry Reminder (7 Days)",
      "Your CampusKart account will expire on [expiry date] in 7 days."
    );

    // 1 day reminder
    await findAndNotify(
      1,
      "Account Expiry Reminder (1 Day)",
      "Your CampusKart account will expire tomorrow ([expiry date])."
    );

    console.log('[ExpiryScheduler] Account expiry check completed successfully.');
  } catch (err) {
    console.error('[ExpiryScheduler] Error during account expiry check:', err);
  }
};

const startExpiryCron = () => {
  // Run daily at midnight (00:00)
  cron.schedule('0 0 * * *', () => {
    runExpiryCheck();
  });
  console.log('[ExpiryScheduler] Daily account expiry cron scheduled.');
};

module.exports = { startExpiryCron, runExpiryCheck };
