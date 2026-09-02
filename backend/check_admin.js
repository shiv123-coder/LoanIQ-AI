const { initFirebase, getDb } = require('./config/firebase');
const { collection, getDocs } = require('firebase/firestore');

async function checkAdmins() {
  console.log('Initializing Firebase...');
  const db = initFirebase();
  if (!db) {
    console.error('Failed to initialize Firebase');
    process.exit(1);
  }

  try {
    const q = collection(db, 'admin_users');
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.empty ? 0 : snapshot.docs.length} admin users.`);
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
  } catch (error) {
    console.error('Error fetching admins:', error.message);
  }
  process.exit(0);
}

checkAdmins();
