/**
 * Check feedback and care data in Firebase
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkData() {
  console.log('=== Checking Feedback & Care Data ===\n');
  
  // Check feedback collection (singular)
  const feedbackSnap = await db.collection('feedback').limit(10).get();
  console.log('feedback collection:', feedbackSnap.size, 'documents');
  if (feedbackSnap.size > 0) {
    console.log('Sample:', JSON.stringify(feedbackSnap.docs[0].data(), null, 2));
  }
  
  // Check feedbacks collection (plural - used in service)
  const feedbacksSnap = await db.collection('feedbacks').limit(10).get();
  console.log('\nfeedbacks collection:', feedbacksSnap.size, 'documents');
  if (feedbacksSnap.size > 0) {
    console.log('Sample:', JSON.stringify(feedbacksSnap.docs[0].data(), null, 2));
  }
  
  // Check students with careHistory
  const studentsSnap = await db.collection('students').limit(5).get();
  console.log('\n=== Students careHistory ===');
  studentsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.careHistory && data.careHistory.length > 0) {
      console.log(`${data.fullName}: ${data.careHistory.length} care logs`);
      console.log('Sample:', JSON.stringify(data.careHistory[0], null, 2));
    }
  });
  
  // Check if there's a care collection
  const careSnap = await db.collection('care').limit(5).get();
  console.log('\ncare collection:', careSnap.size, 'documents');
  
  // Check studentCare collection
  const studentCareSnap = await db.collection('studentCare').limit(5).get();
  console.log('studentCare collection:', studentCareSnap.size, 'documents');
  
  process.exit(0);
}

checkData().catch(console.error);
