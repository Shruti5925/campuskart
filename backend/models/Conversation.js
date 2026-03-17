const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
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
    }]
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
