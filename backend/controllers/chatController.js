const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const AdminMessage = require('../models/AdminMessage');
const AdminConversation = require('../models/AdminConversation');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Order = require('../models/Order');

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        

        // Standard conversations: filter by participants for everyone (privacy for marketplace)
        const stdConvsMatch = await Conversation.aggregate([
            { $match: { participants: new mongoose.Types.ObjectId(userId) } },
            { $sort: { updatedAt: -1 } },
            {
                $addFields: {
                    sortedParticipants: {
                        $cond: {
                            if: { $lt: [{ $arrayElemAt: ["$participants", 0] }, { $arrayElemAt: ["$participants", 1] }] },
                            then: ["$participants"], // Actually this doesn't sort. I'll use a better approach.
                            else: ["$participants"] // Same thing. 
                        }
                    }
                }
            },
            // Let's use string concatenation of sorted ID strings for grouping
            {
                $project: {
                    doc: "$$ROOT",
                    p0: { $toString: { $arrayElemAt: ["$participants", 0] } },
                    p1: { $toString: { $arrayElemAt: ["$participants", 1] } }
                }
            },
            {
                $addFields: {
                    groupId: {
                        $cond: {
                            if: { $lt: ["$p0", "$p1"] },
                            then: { $concat: ["$p0", "_", "$p1"] },
                            else: { $concat: ["$p1", "_", "$p0"] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$groupId",
                    doc: { $first: "$doc" }
                }
            },
            { $replaceRoot: { newRoot: "$doc" } }
        ]);

        const populatedStd = await Conversation.populate(stdConvsMatch, [
            { path: 'participants', select: 'firstName middleName lastName profilePhoto gender role email collegeId department mobileNumber address isVerified isSuspended createdAt' },
            { path: 'product', select: 'title price images image createdAt' }
        ]);

        // Admin conversations: Same stable grouping
        const adminConvsMatch = await AdminConversation.aggregate([
            { $match: { participants: new mongoose.Types.ObjectId(userId) } },
            { $sort: { updatedAt: -1 } },
            {
                $project: {
                    doc: "$$ROOT",
                    p0: { $toString: { $arrayElemAt: ["$participants", 0] } },
                    p1: { $toString: { $arrayElemAt: ["$participants", 1] } }
                }
            },
            {
                $addFields: {
                    groupId: {
                        $cond: {
                            if: { $lt: ["$p0", "$p1"] },
                            then: { $concat: ["$p0", "_", "$p1"] },
                            else: { $concat: ["$p1", "_", "$p0"] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$groupId",
                    doc: { $first: "$doc" }
                }
            },
            { $replaceRoot: { newRoot: "$doc" } }
        ]);

        const populatedAdmin = await AdminConversation.populate(adminConvsMatch, [
            { path: 'participants', select: 'firstName middleName lastName profilePhoto gender role email collegeId department mobileNumber address isVerified isSuspended createdAt' },
            { path: 'product', select: 'title price images image createdAt' }
        ]);

        // Merge and sort
        const allConversations = [...populatedStd, ...populatedAdmin].sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        res.json(allConversations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching conversations' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        
        // Find conversation in either model and check participants
        let conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            conversation = await AdminConversation.findById(conversationId);
        }

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Security Layer: Only participants can view messages
        // (Admins can only view if they are a participant too, per your strict privacy request)
        const isParticipant = conversation.participants.some(p => p.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'Unauthorized access to this conversation' });
        }

        // Try finding in standard first
        let messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate('sender', 'firstName lastName profilePhoto gender role');

        if (messages.length === 0) {
            // Try admin messages
            messages = await AdminMessage.find({ conversationId })
                .sort({ createdAt: 1 })
                .populate('sender', 'firstName lastName profilePhoto gender role');
        }

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, productId, content, type, conversationId } = req.body;
        const senderId = req.user.id;
        const senderRole = req.user.role;
        const isAdmin = senderRole === 'admin';

        let conversation;
        let ConvModel = Conversation;
        let MsgModel = Message;

        if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
            // Check if it's an admin conversation
            conversation = await AdminConversation.findById(conversationId);
            if (conversation) {
                ConvModel = AdminConversation;
                MsgModel = AdminMessage;
            } else {
                conversation = await Conversation.findById(conversationId);
                ConvModel = Conversation;
                MsgModel = Message;
            }
        } else if (receiverId) {
            // Determine if admin is involved
            const receiver = await User.findById(receiverId);
            const isAdminInvolved = isAdmin || (receiver && receiver.role === 'admin');
            
            ConvModel = isAdminInvolved ? AdminConversation : Conversation;
            MsgModel = isAdminInvolved ? AdminMessage : Message;

            // Generate stable interaction key (sorted IDs)
            const p0 = senderId.toString();
            const p1 = receiverId.toString();
            const interactionKey = p0 < p1 ? `${p0}_${p1}` : `${p1}_${p0}`;
            
            // Atomic Find or Create (Upsert)
            conversation = await ConvModel.findOneAndUpdate(
                { interactionKey },
                { 
                    $setOnInsert: { 
                        participants: [senderId, receiverId],
                        product: productId || null,
                        status: 'active'
                    } 
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found or insufficient data' });
        }

        // Consolidated Product Context Update:
        // Every time a message is sent with a productId, update the conversation's product subject
        // to match the latest point of interest between these two users.
        if (productId) {
            conversation.product = productId;
        }

        // Only create auto-order if user is NOT admin and it's a new or existing sale chat (standard only)
        if (!isAdmin && productId && ConvModel === Conversation) {
            try {
                const existingOrder = await Order.findOne({ buyer: senderId, 'products.product': productId });
                if (!existingOrder) {
                    const product = await Product.findById(productId);
                    if (product && product.subCategory !== "support-marker") {
                        const newOrder = new Order({
                            buyer: senderId,
                            products: [{
                                product: product._id,
                                productTitle: product.title,
                                productImage: (product.images && product.images.length > 0) ? product.images[0] : product.image,
                                quantity: 1,
                                priceAtPurchase: product.price || 0
                            }],
                            totalAmount: product.price || 0,
                            status: 'pending'
                        });
                        await newOrder.save();
                    }
                }
            } catch (orderErr) {
                console.error("Error creating auto-order from chat:", orderErr);
            }
        }

        const message = new MsgModel({
            conversationId: conversation._id,
            sender: senderId,
            content,
            type: type || 'text'
        });

        await message.save();

        conversation.lastMessage = content;
        conversation.lastMessageSender = senderId;
        await conversation.save();

        let targetId = receiverId;
        if (!targetId) {
            targetId = conversation.participants.find(p => p.toString() !== senderId.toString());
        }

        const sender = await User.findById(senderId).select('gender avatar firstName lastName');
        const targetReceiverId = (targetId?._id || targetId)?.toString();
        const receiverSocketId = req.users?.get(targetReceiverId);

        if (receiverSocketId && req.io) {
            req.io.to(receiverSocketId).emit('receive_message', {
                ...message.toObject(),
                sender: { 
                    _id: senderId,
                    gender: sender?.gender,
                    avatar: sender?.avatar,
                    firstName: sender?.firstName,
                    lastName: sender?.lastName
                }
            });

            const notification = new Notification({
                user: targetReceiverId,
                type: 'message',
                title: isAdmin ? 'Admin Message' : (sender?.firstName || 'New Message'),
                message: `${sender?.firstName || 'Someone'} sent you a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                link: `/messages?convId=${conversation._id}`
            });
            await notification.save();
            req.io.to(receiverSocketId).emit('new_notification', notification);
        } else {
            const notification = new Notification({
                user: targetReceiverId,
                type: 'message',
                title: isAdmin ? 'Admin Message' : (sender?.firstName || 'New Message'),
                message: `You have a new message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                link: `/messages?convId=${conversation._id}`
            });
            await notification.save();
        }

        res.status(201).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error sending message' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        // Try both models
        await Message.updateMany(
            { conversationId, sender: { $ne: req.user.id }, isRead: false },
            { $set: { isRead: true } }
        );
        await AdminMessage.updateMany(
            { conversationId, sender: { $ne: req.user.id }, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'Messages marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error marking as read' });
    }
};

exports.toggleArchive = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        
        let conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            conversation = await AdminConversation.findById(conversationId);
        }
        
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        const index = conversation.archivedBy.indexOf(userId);
        if (index > -1) {
            conversation.archivedBy.splice(index, 1);
        } else {
            conversation.archivedBy.push(userId);
        }

        await conversation.save();
        res.json({ message: 'Archive status updated', archived: index === -1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error toggling archive' });
    }
};

exports.resolveConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        let conversation = await AdminConversation.findById(conversationId)
            .populate('participants', 'firstName middleName lastName profilePhoto gender role email collegeId department mobileNumber address isVerified')
            .populate('product', 'title price images image createdAt');
        
        if (!conversation) {
            conversation = await Conversation.findById(conversationId)
                .populate('participants', 'firstName middleName lastName profilePhoto gender role email collegeId department mobileNumber address isVerified')
                .populate('product', 'title price images image createdAt');
        }
        
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        conversation.status = 'resolved';
        await conversation.save();

        const userParticipant = conversation.participants.find(p => p.role !== 'admin');
        
        if (userParticipant) {
            const notification = new Notification({
                user: userParticipant._id,
                type: 'info',
                title: 'Ticket Resolved',
                message: `Your support ticket regarding "${conversation.product?.title || 'CampusKart'}" has been marked as resolved.`,
                link: `/messages?convId=${conversation._id}`
            });
            await notification.save();

            const userSocketId = req.users?.get(userParticipant._id.toString());
            if (userSocketId && req.io) {
                req.io.to(userSocketId).emit('new_notification', notification);
            }
        }

        res.json({ message: 'Ticket resolved successfully', conversation });
    } catch (err) {
        console.error('Resolve Conversation Error:', err);
        res.status(500).json({ message: 'Server error resolving ticket' });
    }
};
