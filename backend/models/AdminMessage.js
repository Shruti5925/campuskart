const mongoose = require('mongoose');

const adminMessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminConversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true,
    collection: 'admin_messages'
});

module.exports = mongoose.model('AdminMessage', adminMessageSchema);
