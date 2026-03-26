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
            .populate("reporter", "firstName lastName email")
            .populate({
                path: "targetId",
                refPath: "targetModel"
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
        const { status, adminNotes } = req.body;
        const reportId = req.params.id;

        const report = await Report.findById(reportId);
        if (!report) return res.status(404).json({ message: "Report not found." });

        report.status = status || report.status;
        report.adminNotes = adminNotes || report.adminNotes;
        report.resolvedBy = req.user.id;

        await report.save();

        // Log Activity
        const activity = new AdminActivity({
            admin: req.user.id,
            action: `REPORT_${status.toUpperCase()}`,
            targetType: "Report",
            targetId: report._id,
            targetName: `Report #${report._id.toString().slice(-4)}`,
            status: status === 'resolved' ? "SUCCESSFUL" : "CLOSED"
        });
        await activity.save();

        res.json({ message: `Report marked as ${status}`, report });
    } catch (err) {
        console.error("Update Report Status Error:", err);
        res.status(500).json({ message: err.message });
    }
};
