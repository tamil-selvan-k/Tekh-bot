const express = require('express');
const { chatController } = require('../controllers/chat.controller');

const router = express.Router();

router.post('/message', chatController);

module.exports = router;
