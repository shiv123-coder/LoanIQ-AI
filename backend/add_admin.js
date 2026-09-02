const { initFirebase } = require('./config/firebase');
const { registerAdmin } = require('./services/dbService');

async function main() {
  console.log('🚀 Initializing Firebase...');
  const db = initFirebase();
  if (!db) {
    console.error('❌ Failed to initialize Firebase. Check your .env file.');
    process.exit(1);
  }

  const adminUsername = process.env.ADMIN_USERNAME || 'Shiv';
  const adminPassword = process.env.ADMIN_PASSWORD || 'your_secure_password';

  console.log(`👤 Adding admin: ${adminUsername}`);
  try {
    const result = await registerAdmin(adminUsername, adminPassword);
    if (result.success) {
      console.log(`✅ Admin "${adminUsername}" added successfully!`);
      console.log('ID:', result.id);
    } else {
      console.log('❌ Error adding admin:', result.error);
    }
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
  process.exit(0);
}

main();
