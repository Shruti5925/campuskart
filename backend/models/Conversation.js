const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageSender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },
    archivedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['active', 'resolved'],
        default: 'active'
    },
    interactionKey: {
        type: String,
        unique: true,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
