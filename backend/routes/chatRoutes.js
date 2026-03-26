const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { checkVerified } = require('../middleware/authMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/conversations', authMiddleware, chatController.getConversations);
router.get('/messages/:conversationId', authMiddleware, chatController.getMessages);
router.post('/send', authMiddleware, checkVerified, chatController.sendMessage);
router.put('/read/:conversationId', authMiddleware, chatController.markAsRead);
router.post('/archive/:conversationId', authMiddleware, chatController.toggleArchive);
router.post('/resolve/:conversationId', authMiddleware, chatController.resolveConversation);

module.exports = router;
