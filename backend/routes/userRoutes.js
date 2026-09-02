const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleLogin,
  applicantLogin,
  upgradeApplicant,
  getUserLoans,
  saveUserDocuments,
  getUserProfile,
  updateUserProfile,
  createNotification,
  changePassword
} = require('../services/dbService');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { generateToken, verifyToken } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validate');
const { z } = require('zod');

/**
 * POST /api/user/register
 * Register a new portal user
 */
router.post('/register', authLimiter, validateRequest(z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
    dob: z.string().optional(),
    address: z.string().optional(),
    occupation: z.string().optional(),
  })
})), async (req, res) => {
  try {
    const { name, email, password, phone, dob, address, occupation } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }
    const result = await registerUser(name, email, password, phone, dob, address, occupation);
    if (!result.success) {
      return res.status(400).json(result);
    }
    const token = generateToken({ id: result.userId, role: 'user' });
    
    // Trigger admin notification
    await createNotification('admin', null, 'New User Registration', `User ${name} (${email}) has just registered.`, 'registration', result.userId, 'user');
    await createNotification('loan_officer', null, 'New User Registration', `User ${name} (${email}) has just registered.`, 'registration', result.userId, 'user');

    return res.status(200).json({ ...result, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/user/login
 * Login a portal user with email + password
 */
router.post('/login', authLimiter, validateRequest(z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
})), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    const result = await loginUser(email, password);
    if (!result.success) {
      return res.status(401).json(result);
    }
    const token = generateToken({ id: result.userId, role: 'user' });
    return res.status(200).json({ ...result, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/user/google-login
 * Handle Google OAuth login
 */
router.post('/google-login', authLimiter, validateRequest(z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1)
  })
})), async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Email and name are required' });
    }
    const result = await googleLogin(email, name);
    if (!result.success) {
      return res.status(401).json(result);
    }
    const token = generateToken({ id: result.userId, role: 'user' });
    return res.status(200).json({ ...result, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/user/applicant-login
 * Auto-creates/retrieves a user account from their loan application result
 */
router.post('/applicant-login', authLimiter, async (req, res) => {
  try {
    const { name, panNumber, docId } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const result = await applicantLogin(name, panNumber, docId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    const token = generateToken({ id: result.userId, role: 'user', isApplicant: true });
    return res.status(200).json({ ...result, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/user/upgrade
 * Upgrade a guest applicant into a fully registered user
 */
router.post('/upgrade', authLimiter, async (req, res) => {
  try {
    const { userId, email, password } = req.body;
    if (!userId || !email || !password) {
      return res.status(400).json({ success: false, error: 'UserId, email, and password are required' });
    }
    const result = await upgradeApplicant(userId, email, password);
    if (!result.success) {
      return res.status(400).json(result);
    }
    const token = generateToken({ id: result.userId, role: 'user' });
    return res.status(200).json({ ...result, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/user/my-loans/:userId
 * Get all loan applications associated with a user ID
 */
router.get('/my-loans/:userId', apiLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const loans = await getUserLoans(userId);
    return res.status(200).json({ success: true, loans });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/user/upload-docs
 * Upload documents to Cloudinary and link to user
 */
router.post('/upload-docs', verifyToken, upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }
    
    const fileUrls = req.files.map(file => file.path);
    const userId = req.user.id;
    const result = await saveUserDocuments(userId, fileUrls);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Trigger notifications
    await createNotification('admin', null, 'Documents Uploaded', `User ${userId} uploaded new documents.`, 'document', userId, 'user');
    await createNotification('loan_officer', null, 'Documents Uploaded', `User ${userId} uploaded new documents.`, 'document', userId, 'user');
    
    return res.status(200).json({ success: true, urls: fileUrls });
  } catch (err) {
    console.error('Upload docs error:', err);
    return res.status(500).json({ success: false, error: 'File upload failed' });
  }
});

/**
 * GET /api/user/profile
 * Get the current user's profile
 */
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await getUserProfile(req.user.id);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
router.put('/profile', verifyToken, validateRequest(z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    dob: z.string().optional(),
    address: z.string().optional(),
    occupation: z.string().optional(),
  })
})), async (req, res) => {
  try {
    const updates = req.body;
    // Strictly prevent arbitrary field injection
    const allowedUpdates = {};
    ['name', 'phone', 'dob', 'address', 'occupation'].forEach(field => {
      if (updates[field] !== undefined) {
        allowedUpdates[field] = updates[field];
      }
    });

    const result = await updateUserProfile(req.user.id, allowedUpdates);
    if (!result.success) return res.status(400).json(result);
    
    // Trigger notification
    await createNotification('admin', null, 'Profile Updated', `User ${req.user.id} updated their profile.`, 'profile', req.user.id, 'user');

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/user/password
 * Change current user's password
 */
router.put('/password', verifyToken, validateRequest(z.object({
  body: z.object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(6)
  })
})), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await changePassword(req.user.id, oldPassword, newPassword, 'user');
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
