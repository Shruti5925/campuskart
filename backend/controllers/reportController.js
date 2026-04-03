const Report = require("../models/Report");
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");
const AdminActivity = require("../models/AdminActivity");

// CREATE REPORT
exports.createReport = async (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body;
        const reporterId = req.user.id;

        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ message: "Target type, ID and reason are required." });
        }

        // Validate target model
        let targetModel;
        if (targetType === 'product') targetModel = 'Product';
        else if (targetType === 'user') targetModel = 'User';
        else if (targetType === 'review') targetModel = 'Review';
        else return res.status(400).json({ message: "Invalid target type." });

        const report = new Report({
            reporter: reporterId,
            targetType,
            targetId,
            targetModel,
            reason,
            description
        });

        await report.save();

        // If it's a product, we might want to flag it immediately or just let admin handle it
        // For now, let's just create the report and notify admins
        
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            const notification = new Notification({
                user: admin._id,
                type: 'warning',
                title: 'New Report Filed! 🚩',
                message: `A new report has been filed for a ${targetType}. Reason: ${reason}`,
                link: '/admin'
            });
            await notification.save();

            // Socket emit
            const adminSocketId = req.users?.get(admin._id.toString());
            if (adminSocketId && req.io) {
                req.io.to(adminSocketId).emit('new_notification', notification);
            }
        }

        res.status(201).json({ message: "Report submitted successfully.", report });
    } catch (err) {
        console.error("Create Report Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// GET ALL REPORTS (Admin Only)
exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate("reporter", "firstName lastName email avatar role")
            .populate({
                path: "targetId",
                // Dynamically populate based on model type
                populate: [
                    { path: "seller", select: "firstName lastName email" }, // for products
                    { path: "user", select: "firstName lastName avatar" },  // for reviews
                    { path: "product", select: "title images price" }      // for reviews
                ]
            })
            .sort("-createdAt");
        
        res.json(reports);
    } catch (err) {
        console.error("Get Reports Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// UPDATE REPORT STATUS (Admin Only)
exports.updateReportStatus = async (req, res) => {
    try {
        const { status, adminNotes, action } = req.body;
        const reportId = req.params.id;

        const report = await Report.findById(reportId)
            .populate("reporter", "_id email firstName")
            .populate("targetId");
            
        if (!report) return res.status(404).json({ message: "Report not found." });

        report.status = status || report.status;
        report.adminNotes = adminNotes || report.adminNotes;
        report.resolvedBy = req.user.id;

        // PERFORM MODERATION ACTION IF REQUESTED
        let actionResult = "Status updated.";
        if (status === 'resolved' && action && report.targetId) {
            const Review = require("../models/Review"); // Lazy load locally

            if (action === 'flag_product' && report.targetType === 'product') {
                await Product.findByIdAndUpdate(report.targetId, { isFlagged: true, status: 'rejected' });
                actionResult = "Product flagged and hidden.";
            } 
            else if (action === 'suspend_user' && report.targetType === 'user') {
                await User.findByIdAndUpdate(report.targetId, { isSuspended: true });
                actionResult = "User account suspended.";
            }
            else if (action === 'delete_review' && report.targetType === 'review') {
                await Review.findByIdAndDelete(report.targetId);
                actionResult = "Review permanently removed.";
            }
        }

        await report.save();

        // NOTIFY REPORTER
        if (status === 'resolved' && report.reporter) {
            const reporterNotif = new Notification({
                user: report.reporter._id,
                type: 'info',
                title: 'Report Processed ✅',
                message: `The report you filed regarding ${report.targetType} #${report._id.toString().slice(-4)} has been ${status}. Decision: ${adminNotes || "Action taken by moderator."}`,
                link: '/profile'
            });
            await reporterNotif.save();
        }

        // NOTIFY TARGET (Only if action was taken)
        if (action && report.targetType !== 'review') {
            let targetUserId = report.targetType === 'user' ? report.targetId._id : report.targetId.seller;
            if (targetUserId) {
                const targetNotif = new Notification({
                    user: targetUserId,
                    type: 'warning',
                    title: 'Account/Listing Update ⚠️',
                    message: `Action recorded on your ${report.targetType}: ${actionResult}. Reason: ${adminNotes}`,
                    link: '/profile'
                });
                await targetNotif.save();
            }
        }

        // Log Activity
        const activity = new AdminActivity({
            admin: req.user.id,
            action: `REPORT_${status.toUpperCase()}${action ? `_${action.toUpperCase()}` : ''}`,
            targetType: "Report",
            targetId: report._id,
            targetName: `Report #${report._id.toString().slice(-4)}`,
            status: status === 'resolved' ? "SUCCESSFUL" : "CLOSED"
        });
        await activity.save();

        res.json({ message: `Report marked as ${status}. ${actionResult}`, report });
    } catch (err) {
        console.error("Update Report Status Error:", err);
        res.status(500).json({ message: err.message });
    }
};
