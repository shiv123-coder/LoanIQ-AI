const express = require('express');
const router = express.Router();
const { 
  getApplications, 
  registerAdmin, 
  loginAdmin, 
  getStaffList,
  deleteStaff,
  streamApplications,
  softDeleteApplication,
  restoreApplication,
  permanentDeleteApplication,
  emptyTrash,
  cleanupExpiredApplications,
  updateApplicationDecision,
  getAllUsers,
  updateStaffProfile,
  createNotification,
  getStaffProfile,
  changePassword
} = require('../services/dbService');
const { verifyStaff, verifyAdminOnly } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validate');
const { z } = require('zod');

/**
 * GET /admin/applications/stream
 * Server-Sent Events (SSE) endpoint for real-time applications dashboard
 */
router.get('/applications/stream', (req, res) => {
  // Authentication for SSE via query param
  const token = req.query.token;
  if (!token) return res.status(401).write('data: {"error": "Unauthorized"}\n\n');
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_in_production_123');
    if (decoded.role !== 'admin' && decoded.role !== 'loan_officer') throw new Error();
  } catch (err) {
    return res.status(401).write('data: {"error": "Unauthorized"}\n\n');
  }
  // 1. Setup headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // 2. Initial heartbeat so browser knows it's connected
  res.write('data: {"type":"connected"}\n\n');

  // 3. Start Firestore live stream
  const unsubscribe = streamApplications((data) => {
    // Every time Firestore updates, broadcast it to this connected client
    res.write(`data: ${JSON.stringify({ type: 'update', data })}\n\n`);
  });

  // 4. Cleanup when client closes the browser tab
  req.on('close', () => {
    if (unsubscribe) unsubscribe();
    res.end();
  });
});

/**
 * POST /admin/register
 * Protected by ADMIN_REGISTRATION_SECRET env var in production.
 * If ADMIN_REGISTRATION_SECRET is set, request must include:
 *   Header: X-Admin-Secret: <value>
 */
router.post('/register', async (req, res) => {
  try {
    // ── Production registration guard ──────────────────────────────────────
    const requiredSecret = process.env.ADMIN_REGISTRATION_SECRET;
    if (requiredSecret) {
      const providedSecret = req.headers['x-admin-secret'];
      if (!providedSecret || providedSecret !== requiredSecret) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Valid X-Admin-Secret header required to register an admin',
        });
      }
    }

    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const result = await registerAdmin(username, password, role || 'admin');
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

/**
 * POST /admin/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password required' });
    
    const result = await loginAdmin(username, password);
    if (!result.success) return res.status(401).json(result);
    
    // Generate JWT token
    const { generateToken } = require('../middleware/authMiddleware');
    const token = generateToken({ id: result.token, role: result.role }, '24h');
    
    return res.status(200).json({ success: true, token, role: result.role });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

/**
 * GET /admin/applications
 * Fetch all loan applications from Firestore
 */
router.get('/applications', verifyStaff, async (req, res) => {

  try {
    const apps = await getApplications();
    return res.status(200).json({
      success: true,
      count: apps.length,
      data: apps
    });
  } catch (error) {
    console.error('❌ /admin/applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      message: error.message,
    });
  }
});

/**
 * PATCH /admin/applications/:id/decision
 * Admin approves or rejects a CONDITIONAL application
 */
router.patch('/applications/:id/decision', verifyStaff, validateRequest(z.object({
  body: z.object({ decision: z.enum(['APPROVED', 'REJECTED', 'DISBURSED', 'SENT_BACK']), userId: z.string().optional() }),
  params: z.object({ id: z.string() })
})), async (req, res) => {
  try {
    const { decision } = req.body;
    if (!['APPROVED', 'REJECTED', 'DISBURSED', 'SENT_BACK'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Invalid decision state' });
    }
    let extraUpdates = {};

    if (decision === 'DISBURSED') {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_rYq62zZ5T6KjU2', // Use real or mock test keys
          key_secret: process.env.RAZORPAY_KEY_SECRET || 'aJ8W9P3N6F9K2L4G7H5V1C4M'
        });

        // Create standard Razorpay Payment Link for EMI
        const paymentLink = await razorpay.paymentLink.create({
          amount: 500000, // 5000 INR mock EMI in paise
          currency: 'INR',
          accept_partial: false,
          description: `First EMI Payment for Loan ${req.params.id}`,
          customer: {
            name: 'Customer',
            contact: '+919999999999',
            email: 'customer@example.com'
          },
          notify: { sms: true, email: true },
          reminder_enable: true,
        });
        
        extraUpdates.paymentLink = paymentLink.short_url;
        console.log('✅ Generated Razorpay Link:', paymentLink.short_url);
      } catch (rzpErr) {
        console.error('⚠️ Razorpay Integration Error:', rzpErr);
        extraUpdates.paymentLink = 'https://rzp.io/i/demo_emi_link';
      }
    }

    const result = await updateApplicationDecision(req.params.id, decision, extraUpdates);
    if (!result.success) return res.status(400).json(result);
    
    const { userId } = req.body;
    if (userId) {
      if (decision === 'APPROVED') {
        await createNotification('user', userId, 'Final Approval', 'Your loan application has been fully approved by the Admin!', 'application', req.params.id, 'loan_application');
      } else if (decision === 'REJECTED') {
        await createNotification('user', userId, 'Application Rejected', 'Your loan application was rejected after final review.', 'application', req.params.id, 'loan_application');
      } else if (decision === 'DISBURSED') {
        const linkMsg = extraUpdates.paymentLink ? ` Please pay your first EMI via this Razorpay Link: ${extraUpdates.paymentLink}` : '';
        await createNotification('user', userId, 'Loan Disbursed', 'Your loan amount has been disbursed to your account.' + linkMsg, 'application', req.params.id, 'loan_application');
      }
    }
    
    if (decision === 'SENT_BACK') {
      await createNotification('loan_officer', null, 'Application Sent Back', `Application ${req.params.id} was sent back for review by Admin.`, 'application', req.params.id, 'loan_application');
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /admin/applications/:id
 * Soft delete
 */
router.delete('/applications/:id', verifyAdminOnly, async (req, res) => {
  try {
    const result = await softDeleteApplication(req.params.id);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/trash
 */
router.get('/trash', verifyAdminOnly, async (req, res) => {
  try {
    // Run cleanup on fetch too
    await cleanupExpiredApplications();
    const apps = await getDeletedApplications();
    return res.status(200).json({ success: true, count: apps.length, data: apps });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /admin/trash/:id/restore
 */
router.post('/trash/:id/restore', verifyAdminOnly, async (req, res) => {
  try {
    const result = await restoreApplication(req.params.id);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /admin/trash/:id
 * Permanent delete
 */
router.delete('/trash/:id', verifyAdminOnly, async (req, res) => {
  try {
    const result = await permanentDeleteApplication(req.params.id);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /admin/trash
 * Empty trash (Delete all)
 */
router.delete('/trash', verifyAdminOnly, async (req, res) => {
  try {
    const result = await emptyTrash();
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/profile
 * Fetch logged-in staff profile
 */
router.get('/profile', verifyStaff, async (req, res) => {
  try {
    const result = await getStaffProfile(req.user.id);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /admin/profile
 * Update logged-in staff profile
 */
router.put('/profile', verifyStaff, async (req, res) => {
  try {
    const updates = req.body;
    // Security: Do not allow changing role or pwdHash through this endpoint
    delete updates.role;
    delete updates.pwdHash;
    
    // Only allow specific fields
    const safeUpdates = {};
    ['name', 'email', 'phone', 'address'].forEach(field => {
      if (updates[field] !== undefined) safeUpdates[field] = updates[field];
    });

    const result = await updateStaffProfile(req.user.id, safeUpdates);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /admin/password
 * Change logged-in staff password
 */
router.put('/password', verifyStaff, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Invalid password format' });
    }
    const result = await changePassword(req.user.id, oldPassword, newPassword, req.user.role);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/staff
 * Staff Management (Admin only)
 */
router.get('/staff', verifyAdminOnly, async (req, res) => {
  try {
    const staff = await getStaffList();
    return res.status(200).json({ success: true, data: staff });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /admin/staff/:id
 * Staff Management (Admin only)
 */
router.delete('/staff/:id', verifyAdminOnly, async (req, res) => {
  try {
    const result = await deleteStaff(req.params.id);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /admin/staff/:id
 * Admin ONLY modifies staff details (e.g. role change)
 */
router.put('/staff/:id', verifyAdminOnly, async (req, res) => {
  try {
    const updates = req.body;
    // Don't allow changing to invalid roles
    if (updates.role && !['admin', 'loan_officer'].includes(updates.role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    const result = await updateStaffProfile(req.params.id, updates);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/users
 * Fetch all normal users (Admin / Officer)
 */
router.get('/users', verifyStaff, async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /admin/users/:id
 * Update user details (Admin / Officer)
 * Officers can't change roles (they shouldn't be able to anyway since users don't have admin roles, but good to guard)
 */
router.put('/users/:id', verifyStaff, async (req, res) => {
  try {
    const updates = req.body;
    
    // Safety check: Never let staff inject `pwdHash` or change core user auth identity via this route
    const safeUpdates = {};
    ['name', 'phone', 'dob', 'address', 'occupation'].forEach(field => {
      if (updates[field] !== undefined) safeUpdates[field] = updates[field];
    });

    const result = await updateUserProfile(req.params.id, safeUpdates);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
