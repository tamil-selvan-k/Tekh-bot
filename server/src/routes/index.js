const express = require('express');
const healthRoutes = require('./health.routes');
const chatRoutes = require('./chat.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/chat', chatRoutes);

module.exports = router;
