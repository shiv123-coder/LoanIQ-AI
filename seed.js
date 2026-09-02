/**
 * Firestore Demo Data Seed Script for LoanIQ AI
 * 
 * PREREQUISITES:
 * 1. Go to Firebase Console -> Project Settings -> Service Accounts
 * 2. Click "Generate new private key" and save the JSON file.
 * 3. Rename it to `serviceAccountKey.json` and place it in the same directory as this script.
 * 4. Run `npm install firebase-admin crypto` if not already installed.
 * 5. Execute with: `node seed.js`
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`\n❌ ERROR: Missing serviceAccountKey.json`);
  console.error(`Please download your Firebase Service Account JSON key, rename it to 'serviceAccountKey.json', and place it in ${__dirname}\n`);
  process.exit(1);
}

const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'loaniq-a05f6.firebasestorage.app'
});

const db = getFirestore();

// Helper to hash passwords exactly as the backend expects
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate dates spread across the last 30 days
function getRandomDate(daysBackStart = 30, daysBackEnd = 0) {
  const start = Date.now() - (daysBackStart * 24 * 60 * 60 * 1000);
  const end = Date.now() - (daysBackEnd * 24 * 60 * 60 * 1000);
  return new Date(start + Math.random() * (end - start));
}

// Map user names to their local mockup image
const MOCKUP_MAP = {
  "Shivashankr Mali": path.join(__dirname, 'assets', 'pan_mockups', 'pan_shivashankr.png'),
  "Nagesh Mali": path.join(__dirname, 'assets', 'pan_mockups', 'pan_nagesh.png'),
  "Shivshankar Mali": path.join(__dirname, 'assets', 'pan_mockups', 'pan_shivshankar.png')
};

// Helper to upload to Cloudinary and get a public URL
async function uploadMockupToStorage(localFilePath, fileName) {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: 'loaniq/mockups',
      public_id: path.parse(fileName).name
    });
    
    console.log(`✅ Uploaded ${fileName} to ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error.message);
    return "https://placehold.co/600x400/png?text=Upload+Failed";
  }
}

// Professional User Data
const USERS_DATA = [
  { name: "Shivashankr Mali", email: "malishivashankr5@gmail.com", phone: "+919876543210", dob: "1990-05-15", address: "A-0, Main St, Mumbai", occupation: "Software Engineer" },
  { name: "Shivashankr Mali", email: "shivashankrmali483@gmail.com", phone: "+919876543211", dob: "1991-08-22", address: "B-12, Park Avenue, Delhi", occupation: "Marketing Manager" },
  { name: "Nagesh Mali", email: "nageshmali2006@gmail.com", phone: "+919876543212", dob: "2006-11-10", address: "C-45, Link Road, Bangalore", occupation: "Student / Intern" },
  { name: "Nagesh Mali", email: "nageshmali098510@gmail.com", phone: "+919876543213", dob: "1995-02-18", address: "D-99, Tech Park, Hyderabad", occupation: "Self-Employed" },
  { name: "Shivshankar Mali", email: "shivashankrmali5@gmail.com", phone: "+919876543214", dob: "1992-12-05", address: "E-7, Residency, Pune", occupation: "Financial Analyst" },
];

async function seedData() {
  console.log('🚀 Starting Data Seeding for LoanIQ AI...\n');
  const batch = db.batch();
  
  // ---------------------------------------------------------
  // 1. ADMINS & LOAN OFFICERS
  // ---------------------------------------------------------
  console.log('👤 Seeding Staff (Admins & Officers)...');
  const staff = [
    { username: 'Shiv', role: 'admin', label: 'Admin User', pass: 'Shivmali@123' },
    { username: 'ShivOfficer', role: 'loan_officer', label: 'Loan Officer 1', pass: 'Shivmali@123' },
    { username: 'officer2@loaniq.com', role: 'loan_officer', label: 'Loan Officer 2', pass: 'password123' }
  ];
  
  const staffIds = {};
  for (const s of staff) {
    const staffDocRef = db.collection('admin_users').doc();
    const staffData = {
      username: s.username,
      pwdHash: hashPassword(s.pass),
      role: s.role,
      name: s.label,
      createdAt: new Date().toISOString()
    };
    batch.set(staffDocRef, staffData);
    staffIds[s.role === 'admin' ? 'admin' : `officer${Object.keys(staffIds).length}`] = staffDocRef.id;
  }

  // ---------------------------------------------------------
  // 2. REGULAR USERS
  // ---------------------------------------------------------
  console.log('👥 Seeding Regular Users...');
  const userIds = [];
  for (let i = 0; i < USERS_DATA.length; i++) {
    const user = USERS_DATA[i];
    const ref = db.collection('users').doc();
    batch.set(ref, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      address: user.address,
      occupation: user.occupation,
      pwdHash: hashPassword('password123'),
      createdAt: getRandomDate(30, 25).toISOString()
    });
    userIds.push({ id: ref.id, name: user.name });
  }

  // ---------------------------------------------------------
  // 3. LOAN APPLICATIONS
  // ---------------------------------------------------------
  console.log('📄 Seeding Loan Applications (Various States)...');
  
  const applications = [
    // 1. APPROVED (Low Risk)
    {
      decision: 'APPROVED', creditScore: 820, riskLevel: 'LOW', loanAmount: 500000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 2
    },
    // 2. APPROVED (Medium Risk)
    {
      decision: 'APPROVED', creditScore: 760, riskLevel: 'MEDIUM', loanAmount: 250000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 5
    },
    // 3. DISBURSED
    {
      decision: 'DISBURSED', creditScore: 790, riskLevel: 'LOW', loanAmount: 1000000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 10
    },
    // 4. DISBURSED
    {
      decision: 'DISBURSED', creditScore: 710, riskLevel: 'MEDIUM', loanAmount: 150000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 15
    },
    // 5. REJECTED (High Risk - Low Credit)
    {
      decision: 'REJECTED', creditScore: 410, riskLevel: 'HIGH', loanAmount: 800000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 1
    },
    // 6. REJECTED (Fraud / Fake PAN)
    {
      decision: 'REJECTED', creditScore: 250, riskLevel: 'HIGH', loanAmount: 300000, 
      panVerified: false, liveness: false, aadharVerified: false, daysOld: 8,
      reasons: ["Liveness check failed (Biometric mismatch).", "PAN image appears forged or unreadable."]
    },
    // 7. PENDING REVIEW (Conditional)
    {
      decision: 'CONDITIONAL', creditScore: 650, riskLevel: 'MEDIUM', loanAmount: 400000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 0
    },
    // 8. PENDING REVIEW (Conditional)
    {
      decision: 'CONDITIONAL', creditScore: 590, riskLevel: 'HIGH', loanAmount: 200000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 1
    },
    // 9. KYC PENDING (Missing Liveness)
    {
      decision: 'ACTION_REQUIRED', creditScore: 0, riskLevel: 'HIGH', loanAmount: 100000, 
      panVerified: true, liveness: false, aadharVerified: true, daysOld: 3
    },
    // 10. KYC PENDING (Missing PAN)
    {
      decision: 'ACTION_REQUIRED', creditScore: 0, riskLevel: 'HIGH', loanAmount: 250000, 
      panVerified: false, liveness: true, aadharVerified: true, daysOld: 4
    },
    // 11. SENT BACK
    {
      decision: 'SENT_BACK', creditScore: 680, riskLevel: 'MEDIUM', loanAmount: 500000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 2,
      adminMessage: "Please upload a clearer image of your PAN card. The current one is blurred."
    },
    // 12. SENT BACK
    {
      decision: 'SENT_BACK', creditScore: 710, riskLevel: 'MEDIUM', loanAmount: 300000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 6,
      adminMessage: "Selfie mismatch. Please take a new selfie in a well-lit room."
    },
    // 13. APPROVED (Recent)
    {
      decision: 'APPROVED', creditScore: 840, riskLevel: 'LOW', loanAmount: 1200000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 0
    },
    // 14. DISBURSED (Old)
    {
      decision: 'DISBURSED', creditScore: 750, riskLevel: 'LOW', loanAmount: 50000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 25
    },
    // 15. REJECTED (High DTI)
    {
      decision: 'REJECTED', creditScore: 520, riskLevel: 'HIGH', loanAmount: 2000000, 
      panVerified: true, liveness: true, aadharVerified: true, daysOld: 12,
      reasons: ["Loan-to-income ratio exceeds permissible limits (> 9x annual)."]
    }
  ];

  for (let i = 0; i < applications.length; i++) {
    const template = applications[i];
    const user = userIds[i % userIds.length];
    const date = getRandomDate(template.daysOld + 1, template.daysOld);
    
    let uploadedPanUrl = null;
    if (template.panVerified) {
       const localImagePath = MOCKUP_MAP[user.name];
       if (fs.existsSync(localImagePath)) {
          const remoteFileName = `dummy_docs/pan_${user.id}_${Date.now()}.png`;
          uploadedPanUrl = await uploadMockupToStorage(localImagePath, remoteFileName);
       } else {
          uploadedPanUrl = "https://placehold.co/600x400/png?text=PAN+Card";
       }
    }

    const docData = {
      userId: user.id,
      decision: template.decision,
      creditScore: template.creditScore,
      riskLevel: template.riskLevel,
      loanAmount: template.loanAmount,
      purpose: i % 2 === 0 ? "Home Renovation" : "Medical Emergency",
      customerDetails: {
        name: user.name,
        pan: template.panVerified ? `ABCDE${1234 + i}F` : null,
        income: 50000 + (i * 10000),
        employmentType: i % 3 === 0 ? 'Self-Employed' : 'Salaried'
      },
      verification: {
        panVerified: template.panVerified,
        liveness: template.liveness,
        aadharVerified: template.aadharVerified
      },
      documents: {
        panImage: uploadedPanUrl,
        selfie: template.liveness ? "https://placehold.co/400x400/png?text=Selfie" : null,
      },
      analysis: `AI Analysis: The applicant shows a ${template.riskLevel.toLowerCase()} risk profile. Income stability is verified.`,
      rejectionReasons: template.reasons || [],
      adminNotes: template.adminMessage || "",
      timestamp: date.getTime(),
      createdAt: date.toISOString(),
      adminReviewedAt: ['APPROVED', 'REJECTED', 'DISBURSED', 'SENT_BACK'].includes(template.decision) ? new Date(date.getTime() + 86400000).toISOString() : null
    };

    // Add dummy offers for approved/disbursed loans
    if (['APPROVED', 'DISBURSED'].includes(template.decision)) {
      docData.offer = {
        offeredAmount: template.loanAmount,
        interestRate: template.riskLevel === 'LOW' ? 9.5 : 12.0,
        tenure: 36,
        emi: Math.round(template.loanAmount * 0.032), // Rough estimation
        processingFee: template.loanAmount * 0.01
      };
    }

    const ref = db.collection('loan_applications').doc();
    batch.set(ref, docData);
  }

  // ---------------------------------------------------------
  // 4. DELETED APPLICATIONS (Trash)
  // ---------------------------------------------------------
  console.log('🗑️ Seeding Trash (Deleted Applications)...');
  for (let i = 0; i < 2; i++) {
    const user = userIds[i];
    const delDate = getRandomDate(2, 0);
    const ref = db.collection('deleted_applications').doc();
    batch.set(ref, {
      userId: user.id,
      decision: 'REJECTED',
      creditScore: 400,
      riskLevel: 'HIGH',
      loanAmount: 100000,
      customerDetails: { name: user.name, income: 20000 },
      verification: { panVerified: true, liveness: true },
      deletedAt: delDate.getTime(),
      expiryAt: delDate.getTime() + (3 * 24 * 60 * 60 * 1000), // 3 days expiry
      originalCollection: 'loan_applications',
      timestamp: delDate.getTime() - 86400000
    });
  }

  // ---------------------------------------------------------
  // 5. NOTIFICATIONS
  // ---------------------------------------------------------
  console.log('🔔 Seeding Notifications...');
  for (let i = 0; i < 5; i++) {
    const ref = db.collection('notifications').doc();
    batch.set(ref, {
      userId: userIds[0].id,
      role: 'user',
      title: i % 2 === 0 ? 'Application Update' : 'Document Required',
      message: i % 2 === 0 ? 'Your application has been conditionally approved.' : 'Please re-upload your PAN card.',
      type: i % 2 === 0 ? 'success' : 'warning',
      read: i > 2, // Last 2 are unread
      timestamp: getRandomDate(5, 0).getTime()
    });
  }

  // Add a few for the admin
  for (let i = 0; i < 3; i++) {
    const ref = db.collection('notifications').doc();
    batch.set(ref, {
      userId: staffIds.admin,
      role: 'admin',
      title: 'New Application',
      message: 'A new high-priority loan application requires manual review.',
      type: 'info',
      read: false,
      timestamp: getRandomDate(1, 0).getTime()
    });
  }

  // COMMIT
  try {
    await batch.commit();
    console.log('\n✅ SEEDING COMPLETE! All dummy data inserted successfully.');
    console.log('You can now log in using the following credentials:');
    console.log('- Admin: Shiv / Shivmali@123');
    console.log('- Officer: ShivOfficer / Shivmali@123');
    console.log('- User: malishivashankr5@gmail.com / password123');
    console.log('  (and other seeded emails with the same password)');
  } catch (error) {
    console.error('\n❌ ERROR during seeding:', error);
  }
}

seedData();
