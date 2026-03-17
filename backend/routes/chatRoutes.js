const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/conversations', authMiddleware, chatController.getConversations);
router.get('/messages/:conversationId', authMiddleware, chatController.getMessages);
router.post('/send', authMiddleware, chatController.sendMessage);
router.put('/read/:conversationId', authMiddleware, chatController.markAsRead);
router.post('/archive/:conversationId', authMiddleware, chatController.toggleArchive);

module.exports = router;
