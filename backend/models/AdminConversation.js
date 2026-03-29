const mongoose = require('mongoose');

const adminConversationSchema = new mongoose.Schema({
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
}, { 
    timestamps: true,
    collection: 'admin_conversations'
});

module.exports = mongoose.model('AdminConversation', adminConversationSchema);
