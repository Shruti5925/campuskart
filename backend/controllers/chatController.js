const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Product = require('../models/Product');
const User = require('../models/User');

exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
            .populate('participants', 'firstName lastName avatar gender')
            .populate('product', 'title price images image createdAt')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching conversations' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate('sender', 'firstName lastName avatar gender');

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, productId, content, type } = req.body;
        const senderId = req.user.id;

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
            product: productId
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, receiverId],
                product: productId
            });
        }

        const message = new Message({
            conversationId: conversation._id,
            sender: senderId,
            content,
            type: type || 'text'
        });

        await message.save();

        conversation.lastMessage = content;
        conversation.lastMessageSender = senderId;
        // Optionally update unread count here
        await conversation.save();

        // Fetch sender info for socket emit
        const sender = await User.findById(senderId).select('gender avatar firstName lastName');

        // Emit message to receiver via socket if connected
        const receiverSocketId = req.users?.get(receiverId.toString());
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
        await Message.updateMany(
            { conversationId, sender: { $ne: req.user.id }, read: false },
            { $set: { read: true } }
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
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        const index = conversation.archivedBy.indexOf(userId);
        if (index > -1) {
            conversation.archivedBy.splice(index, 1); // Unarchive
        } else {
            conversation.archivedBy.push(userId); // Archive
        }

        await conversation.save();
        res.json({ message: 'Archive status updated', archived: index === -1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error toggling archive' });
    }
};
