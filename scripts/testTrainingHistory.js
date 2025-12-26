/**
 * Test Training History - Direct Firestore Update
 * This bypasses frontend to test Cloud Function tracking
 * 
 * Run: node scripts/testTrainingHistory.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../functions/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testTrainingHistory() {
  // Get first class to test
  const classesSnap = await db.collection('classes').limit(1).get();
  
  if (classesSnap.empty) {
    console.log('No classes found');
    return;
  }
  
  const classDoc = classesSnap.docs[0];
  const classData = classDoc.data();
  
  console.log('Testing with class:', classData.name);
  console.log('Current room:', classData.room);
  console.log('Current history count:', (classData.trainingHistory || []).length);
  
  // Update room directly (bypassing frontend)
  const newRoom = classData.room === 'P201' ? 'P202' : 'P201';
  
  console.log('\nUpdating room to:', newRoom);
  
  await db.collection('classes').doc(classDoc.id).update({
    room: newRoom
  });
  
  console.log('Update done! Cloud Function should add history entry.');
  console.log('\nWait 5 seconds then check...');
  
  // Wait for Cloud Function to process
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check result
  const updatedDoc = await db.collection('classes').doc(classDoc.id).get();
  const updatedData = updatedDoc.data();
  
  console.log('\n--- RESULT ---');
  console.log('New history count:', (updatedData.trainingHistory || []).length);
  console.log('Latest entries:');
  
  const history = updatedData.trainingHistory || [];
  history.slice(-3).forEach(entry => {
    console.log(`  [${entry.type}] ${entry.description}`);
    console.log(`    ${entry.oldValue} → ${entry.newValue}`);
    console.log(`    By: ${entry.changedBy}`);
  });
  
  process.exit(0);
}

testTrainingHistory().catch(console.error);
