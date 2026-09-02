const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const dbService = require('../services/dbService');

/**
 * GET /api/notifications/stream
 * SSE endpoint for real-time notifications
 */
router.get('/stream', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).write('data: {"error": "Unauthorized"}\n\n');
  
  const jwt = require('jsonwebtoken');
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_in_production_123');
  } catch (err) {
    return res.status(401).write('data: {"error": "Unauthorized"}\n\n');
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  
  res.write('data: {"type":"connected"}\n\n');

  const unsubscribe = dbService.streamNotifications(decoded.role, decoded.id, (notifications) => {
    res.write(`data: ${JSON.stringify({ type: 'NOTIFICATIONS_UPDATE', notifications })}\n\n`);
  });

  if (!unsubscribe) {
    res.write(`data: ${JSON.stringify({ type: 'ERROR', message: 'Database stream unavailable' })}\n\n`);
    res.end();
    return;
  }

  req.on('close', () => {
    unsubscribe();
    res.end();
  });
});

// All other notification routes require standard authentication
router.use(verifyToken);

/**
 * GET /api/notifications
 * Fetch latest notifications
 */
router.get('/', async (req, res) => {
  try {
    const notifications = await dbService.getNotifications(req.user.role, req.user.id);
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});



/**
 * POST /api/notifications
 * Create a new notification (e.g. from frontend action like PDF generation)
 */
router.post('/', async (req, res) => {
  try {
    const { title, message, type } = req.body;
    // Users can only create notifications for themselves (e.g., PDF generation alert)
    const docId = await dbService.createNotification(
      req.user.role,
      req.user.id,
      title,
      message,
      type || 'info',
      null,
      null
    );
    if (docId) {
      res.json({ success: true, id: docId });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create notification' });
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const result = await dbService.markNotificationRead(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all user's notifications as read
 */
router.patch('/read-all', async (req, res) => {
  try {
    const result = await dbService.markAllNotificationsRead(req.user.role, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await dbService.deleteNotification(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /api/notifications
 * Clear all user's notifications
 */
router.delete('/', async (req, res) => {
  try {
    const result = await dbService.clearAllNotifications(req.user.role, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
