const { getDb } = require('../config/firebase');
const { collection, addDoc, getDocs, getDoc, query, orderBy, limit, where, onSnapshot, doc, deleteDoc, setDoc, updateDoc } = require('firebase/firestore');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Save loan application report to Firestore
 * @param {Object} report - Full report object
 * @returns {string|null} Document ID or null if DB unavailable
 */
async function saveReport(report) {
  const db = getDb();
  if (!db) {
    console.warn('⚠️  Firestore not available, skipping save');
    return null;
  }

  try {
    const addPromise = addDoc(collection(db, 'loan_applications'), {
      ...report,
      paidAmount: 0,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    });

    // 5-second timeout to prevent indefinite hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore connection timeout')), 5000)
    );

    const docRef = await Promise.race([addPromise, timeoutPromise]);

    console.log('✅ Report saved to Firestore:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Firestore save error:', error.message);
    return null;
  }
}

/**
 * Retrieve all loan applications (admin)
 * @returns {Array} List of applications
 */
async function getApplications() {
  const db = getDb();
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'loan_applications'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Firestore fetch error:', error.message);
    return [];
  }
}

async function registerAdmin(username, password, role = 'admin') {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    const q = query(collection(db, 'admin_users'), where('username', '==', username));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return { success: false, error: 'Username already exists' };

    const pwdHash = hashPassword(password);
    const docRef = await addDoc(collection(db, 'admin_users'), {
      username,
      pwdHash,
      role, // 'admin' or 'loan_officer'
      createdAt: new Date().toISOString()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function loginAdmin(username, password) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    const q = query(collection(db, 'admin_users'), where('username', '==', username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { success: false, error: 'Invalid credentials' };

    const adminDoc = snapshot.docs[0].data();
    if (adminDoc.pwdHash !== hashPassword(password)) {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: true, token: snapshot.docs[0].id, role: adminDoc.role || 'admin' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Staff Management: Get all staff members
 */
async function getStaffList() {
  const db = getDb();
  if (!db) return [];

  try {
    const q = query(collection(db, 'admin_users'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Remove pwdHash from response for security
      const { pwdHash, ...safeData } = data;
      return { id: doc.id, ...safeData };
    });
  } catch (error) {
    console.error('getStaffList error:', error.message);
    return [];
  }
}

/**
 * Staff Management: Get single staff profile
 */
async function getStaffProfile(staffId) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };
  try {
    const docSnap = await getDoc(doc(db, 'admin_users', staffId));
    if (!docSnap.exists()) return { success: false, error: 'Staff not found' };
    const data = docSnap.data();
    delete data.pwdHash;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Staff Management: Delete staff member
 */
async function deleteStaff(id) {
  const db = getDb();
  if (!db) return { success: false, error: 'DB unavailable' };

  try {
    await deleteDoc(doc(db, 'admin_users', id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Stream all loan applications in real-time
 * @param {Function} callback - Function to receive the data array
 * @returns {Function|null} Unsubscribe function, or null if DB unavailable
 */
function streamApplications(callback) {
  const db = getDb();
  if (!db) return null;

  try {
    const q = query(
      collection(db, 'loan_applications'),
      limit(50)
    );
    
    // onSnapshot listens to Firestore continuously
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, (error) => {
      console.error('❌ Firestore stream error:', error.message);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Firestore stream setup error:', error.message);
    return null;
  }
}

/**
 * Register a new portal user
 */
async function registerUser(name, email, password, phone, dob, address, occupation) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    // Check if email already exists
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) return { success: false, error: 'Email already registered' };

    const pwdHash = hashPassword(password);
    const docRef = await addDoc(collection(db, 'users'), {
      name,
      email,
      phone: phone || '',
      dob: dob || '',
      address: address || '',
      occupation: occupation || '',
      pwdHash,
      createdAt: new Date().toISOString(),
    });

    return { success: true, token: docRef.id, name, userId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Login a portal user with email + password
 */
async function loginUser(email, password) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return { success: false, error: 'Invalid email or password' };

    const doc = snap.docs[0];
    const data = doc.data();
    if (data.pwdHash !== hashPassword(password)) {
      return { success: false, error: 'Invalid email or password' };
    }

    return { success: true, token: doc.id, name: data.name, userId: doc.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Handle Google Sign-in: Auto-register if not exists, otherwise login
 */
async function googleLogin(email, name) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);

    if (snap.empty) {
      // User doesn't exist, auto-register
      const docRef = await addDoc(collection(db, 'users'), {
        name,
        email,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
      });
      return { success: true, token: docRef.id, name, userId: docRef.id };
    }

    // User exists, login
    const doc = snap.docs[0];
    const data = doc.data();
    return { success: true, token: doc.id, name: data.name, userId: doc.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Auto-login/register an applicant by their name/PAN from the loan result
 */
async function applicantLogin(name, panNumber, docId) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    // Try to find existing applicant record
    let q;
    if (panNumber) {
      q = query(collection(db, 'applicant_users'), where('panNumber', '==', panNumber));
    } else {
      q = query(collection(db, 'applicant_users'), where('name', '==', name), limit(1));
    }
    const snap = await getDocs(q);

    let userId;
    if (!snap.empty) {
      const applicantDoc = snap.docs[0];
      userId = applicantDoc.id;
      
      // Add the new docId to the legacy loanDocIds array if it exists
      if (docId) {
        const currentIds = applicantDoc.data().loanDocIds || [];
        if (!currentIds.includes(docId)) {
           await updateDoc(doc(db, 'applicant_users', userId), {
             loanDocIds: [...currentIds, docId]
           });
        }
      }
    } else {
      // Create new applicant record
      const docRef = await addDoc(collection(db, 'applicant_users'), {
        name,
        panNumber: panNumber || null,
        loanDocIds: docId ? [docId] : [],
        createdAt: new Date().toISOString(),
      });
      userId = docRef.id;
    }

    // Link the loan application to this user ID so it appears in their dashboard
    if (docId) {
      try {
        const loanRef = doc(db, 'loan_applications', docId);
        await updateDoc(loanRef, { userId });
      } catch (e) {
        console.error('Failed to link docId to userId:', e.message);
      }
    }

    return { success: true, token: userId, name, userId, isApplicant: true };
  } catch (error) {
    console.error('applicantLogin error:', error.message);
    return { success: false, error: 'Firebase connection failed. Please try again.' };
  }
}

/**
 * Upgrade a guest applicant to a fully registered user
 */
async function upgradeApplicant(userId, email, password) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    // Check if email already exists in users collection
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) return { success: false, error: 'Email already registered' };

    // Get the applicant doc
    const applicantRef = doc(db, 'applicant_users', userId);
    const applicantSnap = await getDoc(applicantRef);
    if (!applicantSnap.exists()) {
      return { success: false, error: 'Applicant record not found' };
    }
    
    const applicantData = applicantSnap.data();
    const pwdHash = hashPassword(password);

    // Create the full user doc with the EXACT same ID
    await setDoc(doc(db, 'users', userId), {
      name: applicantData.name,
      email,
      pwdHash,
      createdAt: new Date().toISOString(),
      legacyLoanDocIds: applicantData.loanDocIds || [] // Keep reference to legacy loans
    });

    // Delete the applicant record so it doesn't duplicate
    await deleteDoc(applicantRef);

    return { success: true, token: userId, name: applicantData.name, userId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get loan applications for a specific user by their userId
 */
async function getUserLoans(userId) {
  const db = getDb();
  if (!db) return [];

  try {
    const fetchPromise = (async () => {
      let q;
      let extraLoans = [];

      // If it's a real userId (not a local fallback), filter by it
      if (userId && !userId.startsWith('local_')) {
        // Backward compatibility: fetch loans that were linked via loanDocIds before the userId patch
        try {
          let appData = null;
          
          // First check applicant_users
          const applicantSnap = await getDoc(doc(db, 'applicant_users', userId));
          if (applicantSnap.exists()) {
             appData = applicantSnap.data();
          } else {
             // Check registered users for legacy loans
             const userSnap = await getDoc(doc(db, 'users', userId));
             if (userSnap.exists()) {
               appData = userSnap.data();
               // Remap legacyLoanDocIds to loanDocIds for compatibility below
               if (appData.legacyLoanDocIds) {
                 appData.loanDocIds = appData.legacyLoanDocIds;
               }
             }
          }

          if (appData) {
             const loanDocIds = appData.loanDocIds || [];
             const loanPromises = loanDocIds.map(id => getDoc(doc(db, 'loan_applications', id)));
             const loanSnaps = await Promise.all(loanPromises);
             loanSnaps.forEach(loanSnap => {
               if (loanSnap.exists()) {
                 extraLoans.push({ id: loanSnap.id, ...loanSnap.data() });
               }
             });

             // Ultimate fallback: find any orphaned loans matching the applicant's exact name
             if (appData.name) {
               const nameQuery = query(
                 collection(db, 'loan_applications'),
                 where('customerDetails.name', '==', appData.name),
                 limit(50)
               );
               const nameSnap = await getDocs(nameQuery);
               nameSnap.forEach(doc => {
                 extraLoans.push({ id: doc.id, ...doc.data() });
               });
             }
          }
        } catch(e) {
          console.error('Failed to fetch legacy loanDocIds or by name:', e);
        }

        q = query(
          collection(db, 'loan_applications'),
          where('userId', '==', userId),
          limit(50)
        );
      } else {
        // Guest: return recent applications
        q = query(
          collection(db, 'loan_applications'),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
      }
      const snap = await getDocs(q);
      const queriedLoans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Merge and deduplicate
      const allLoansMap = new Map();
      extraLoans.forEach(l => allLoansMap.set(l.id, l));
      queriedLoans.forEach(l => allLoansMap.set(l.id, l));
      
      return Array.from(allLoansMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    })();

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000)
    );

    return await Promise.race([fetchPromise, timeout]);
  } catch (error) {
    console.error('getUserLoans error:', error.message);
    return [];
  }
}

/**
 * Soft delete an application (moves to trash with 3-day expiry)
 */
async function softDeleteApplication(id) {
  const db = getDb();
  if (!db) return { success: false, error: 'DB unavailable' };

  try {
    const docRef = doc(db, 'loan_applications', id);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) return { success: false, error: 'Application not found' };

    const data = snap.data();
    const deletedAt = Date.now();
    const expiryAt = deletedAt + (3 * 24 * 60 * 60 * 1000); // 3 days

    // Move to deleted_applications (internal name, but UI says Expiry)
    await setDoc(doc(db, 'deleted_applications', id), {
      ...data,
      deletedAt,
      expiryAt,
      originalCollection: 'loan_applications'
    });

    // Remove from original
    await deleteDoc(docRef);

    return { success: true };
  } catch (error) {
    console.error('softDeleteApplication error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Restore a deleted application
 */
async function restoreApplication(id) {
  const db = getDb();
  if (!db) return { success: false, error: 'DB unavailable' };

  try {
    const docRef = doc(db, 'deleted_applications', id);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) return { success: false, error: 'Deleted application not found' };

    const data = snap.data();
    const { deletedAt, expiryAt, originalCollection, ...originalData } = data;

    // Move back to loan_applications
    await setDoc(doc(db, 'loan_applications', id), originalData);

    // Remove from trash
    await deleteDoc(docRef);

    return { success: true };
  } catch (error) {
    console.error('restoreApplication error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Permanently delete application
 */
async function permanentDeleteApplication(id) {
  const db = getDb();
  if (!db) return { success: false, error: 'DB unavailable' };

  try {
    await deleteDoc(doc(db, 'deleted_applications', id));
    return { success: true };
  } catch (error) {
    console.error('permanentDeleteApplication error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Permanently delete ALL applications in trash
 */
async function emptyTrash() {
  const db = getDb();
  if (!db) return { success: false, error: 'DB unavailable' };

  try {
    const q = query(collection(db, 'deleted_applications'));
    const snapshot = await getDocs(q);
    let count = 0;
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, 'deleted_applications', d.id));
      count++;
    }
    return { success: true, count };
  } catch (error) {
    console.error('emptyTrash error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get all deleted applications
 */
async function getDeletedApplications() {
  const db = getDb();
  if (!db) return [];

  try {
    // Note: removed orderBy to avoid index-required PERMISSION_DENIED errors
    const q = query(collection(db, 'deleted_applications'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('getDeletedApplications error:', error.message);
    return [];
  }
}

/**
 * Update the admin decision on a CONDITIONAL application
 * @param {string} id - Document ID
 * @param {'APPROVED'|'REJECTED'} newDecision - Admin's final decision
 */
async function updateApplicationDecision(id, newDecision, extraUpdates = {}) {
  const db = getDb();
  if (!db) return { success: false, error: 'DB unavailable' };

  try {
    const docRef = doc(db, 'loan_applications', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { success: false, error: 'Application not found' };

    await updateDoc(docRef, {
      decision: newDecision,
      adminReviewedAt: new Date().toISOString(),
      adminDecision: newDecision,
      ...extraUpdates
    });

    return { success: true };
  } catch (error) {
    console.error('updateApplicationDecision error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Background cleanup for expired applications
 */
async function cleanupExpiredApplications() {
  const db = getDb();
  if (!db) return 0;

  try {
    const now = Date.now();
    const q = query(collection(db, 'deleted_applications'), where('expiryAt', '<=', now));
    const snap = await getDocs(q);
    
    let count = 0;
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'deleted_applications', d.id));
      count++;
    }
    if (count > 0) console.log(`🧹 Cleaned up ${count} expired applications`);
    return count;
  } catch (error) {
    console.error('cleanupExpiredApplications error:', error.message);
    return 0;
  }
}

/**
 * Save user uploaded documents
 */
async function saveUserDocuments(userId, documentUrls) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    
    if (snap.exists()) {
      const existingDocs = snap.data().documents || [];
      await updateDoc(userRef, {
        documents: [...existingDocs, ...documentUrls]
      });
      return { success: true };
    }
    
    // Also check applicant_users just in case they haven't upgraded yet
    const applicantRef = doc(db, 'applicant_users', userId);
    const appSnap = await getDoc(applicantRef);
    if (appSnap.exists()) {
      const existingDocs = appSnap.data().documents || [];
      await updateDoc(applicantRef, {
        documents: [...existingDocs, ...documentUrls]
      });
      return { success: true };
    }

    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('saveUserDocuments error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get User Profile
 */
async function getUserProfile(userId) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };
  try {
    let docSnap = await getDoc(doc(db, 'users', userId));
    if (!docSnap.exists()) {
      docSnap = await getDoc(doc(db, 'applicant_users', userId));
    }
    if (!docSnap.exists()) return { success: false, error: 'User not found' };
    const data = docSnap.data();
    delete data.pwdHash;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Update User Profile
 */
async function updateUserProfile(userId, updates) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };
  try {
    const userRef = doc(db, 'users', userId);
    const applicantRef = doc(db, 'applicant_users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, updates);
    } else {
      const applicantSnap = await getDoc(applicantRef);
      if (applicantSnap.exists()) {
        await updateDoc(applicantRef, updates);
      } else {
        return { success: false, error: 'User not found' };
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Change Password
 */
async function changePassword(userId, oldPassword, newPassword, role) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };
  try {
    const bcrypt = require('bcryptjs');
    let collectionName = role === 'admin' || role === 'loan_officer' ? 'admin_users' : 'users';
    let docRef = doc(db, collectionName, userId);
    let docSnap = await getDoc(docRef);

    if (!docSnap.exists() && role === 'user') {
      collectionName = 'applicant_users';
      docRef = doc(db, collectionName, userId);
      docSnap = await getDoc(docRef);
    }

    if (!docSnap.exists()) return { success: false, error: 'User not found' };

    const data = docSnap.data();
    
    // Some applicants might not have a password yet (if upgraded later)
    if (data.pwdHash) {
      const match = await bcrypt.compare(oldPassword, data.pwdHash);
      if (!match) return { success: false, error: 'Incorrect current password' };
    } else {
      if (oldPassword && oldPassword.length > 0) {
        return { success: false, error: 'Incorrect current password' }; // if they don't have one, old pwd should probably be blank but here we just require proper upgrade flow.
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await updateDoc(docRef, { pwdHash: hash });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Get all normal users (Admin)
 */
async function getAllUsers() {
  const db = getDb();
  if (!db) return [];
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => {
      const data = doc.data();
      delete data.pwdHash;
      return { id: doc.id, ...data };
    });
  } catch (error) {
    console.error('getAllUsers error:', error.message);
    return [];
  }
}

/**
 * Update Staff Profile (Admin)
 */
async function updateStaffProfile(staffId, updates) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };
  try {
    // If password is provided, hash it
    if (updates.password) {
      updates.pwdHash = hashPassword(updates.password);
      delete updates.password;
    }
    await updateDoc(doc(db, 'admin_users', staffId), updates);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ====== NOTIFICATIONS ======

async function createNotification(recipientRole, recipientId, title, message, type, relatedEntityId, relatedEntityType) {
  const db = getDb();
  if (!db) return null;

  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      recipientRole,
      recipientId: recipientId || null,
      title,
      message,
      type: type || 'info',
      relatedEntityId: relatedEntityId || null,
      relatedEntityType: relatedEntityType || null,
      isRead: false,
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

async function getNotifications(role, userId) {
  const db = getDb();
  if (!db) return [];

  try {
    let q;
    if (role === 'user' && userId) {
      q = query(collection(db, 'notifications'), where('recipientId', '==', userId));
    } else {
      q = query(collection(db, 'notifications'), where('recipientRole', '==', role));
    }
    const snapshot = await getDocs(q);
    let notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return notifs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

async function markNotificationRead(id) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };
  try {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function markAllNotificationsRead(role, userId) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };
  try {
    let q;
    if (role === 'user' && userId) {
      q = query(collection(db, 'notifications'), where('recipientId', '==', userId), where('isRead', '==', false));
    } else {
      q = query(collection(db, 'notifications'), where('recipientRole', '==', role), where('isRead', '==', false));
    }
    const snapshot = await getDocs(q);
    const batchPromises = snapshot.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { isRead: true }));
    await Promise.all(batchPromises);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteNotification(id) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };
  try {
    await deleteDoc(doc(db, 'notifications', id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function clearAllNotifications(role, userId) {
  const db = getDb();
  if (!db) return { success: false, error: 'Database unavailable' };
  try {
    let q;
    if (role === 'user' && userId) {
      q = query(collection(db, 'notifications'), where('recipientId', '==', userId));
    } else {
      q = query(collection(db, 'notifications'), where('recipientRole', '==', role));
    }
    const snapshot = await getDocs(q);
    const batchPromises = snapshot.docs.map(d => deleteDoc(doc(db, 'notifications', d.id)));
    await Promise.all(batchPromises);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function streamNotifications(role, userId, callback) {
  const db = getDb();
  if (!db) return null;
  
  let q;
  if (role === 'user' && userId) {
    q = query(collection(db, 'notifications'), where('recipientId', '==', userId));
  } else {
    q = query(collection(db, 'notifications'), where('recipientRole', '==', role));
  }
  
  return onSnapshot(q, (snapshot) => {
    let notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    notifs = notifs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
    callback(notifs);
  }, (error) => {
    console.error('Notification stream error:', error);
  });
}

module.exports = {
  saveReport,
  getApplications,
  registerAdmin,
  loginAdmin,
  getStaffList,
  getStaffProfile,
  deleteStaff,
  streamApplications,
  registerUser,
  loginUser,
  googleLogin,
  applicantLogin,
  upgradeApplicant,
  getUserLoans,
  softDeleteApplication,
  restoreApplication,
  permanentDeleteApplication,
  emptyTrash,
  getDeletedApplications,
  cleanupExpiredApplications,
  updateApplicationDecision,
  saveUserDocuments,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateStaffProfile,
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  changePassword,
  streamNotifications
};
