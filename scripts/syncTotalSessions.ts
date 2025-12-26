/**
 * Script to sync totalSessions from classSessions collection to classes collection
 * Run with: npx ts-node scripts/syncTotalSessions.ts
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../functions/service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath)
});

const db = admin.firestore();

async function syncTotalSessions() {
  console.log('🔄 Starting totalSessions sync...\n');

  // Get all classes
  const classesSnap = await db.collection('classes').get();
  console.log(`📚 Found ${classesSnap.size} classes\n`);

  let updated = 0;
  let skipped = 0;
  let noSessions = 0;

  for (const classDoc of classesSnap.docs) {
    const classData = classDoc.data();
    const classId = classDoc.id;
    const className = classData.name;

    // Count actual sessions in classSessions collection
    const sessionsSnap = await db.collection('classSessions')
      .where('classId', '==', classId)
      .get();
    
    const actualSessionCount = sessionsSnap.size;
    const currentTotalSessions = classData.totalSessions;

    console.log(`📖 ${className}:`);
    console.log(`   - Current totalSessions: ${currentTotalSessions || 'NOT SET'}`);
    console.log(`   - Actual sessions in DB: ${actualSessionCount}`);

    if (actualSessionCount === 0) {
      console.log(`   ⚠️  No sessions found - skipping\n`);
      noSessions++;
      continue;
    }

    if (currentTotalSessions === actualSessionCount) {
      console.log(`   ✅ Already in sync\n`);
      skipped++;
      continue;
    }

    // Update class with actual session count
    await db.collection('classes').doc(classId).update({
      totalSessions: actualSessionCount,
      progress: `0/${actualSessionCount}`,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`   ✅ Updated totalSessions: ${currentTotalSessions || 'null'} → ${actualSessionCount}\n`);
    updated++;
  }

  console.log('\n========== SYNC COMPLETE ==========');
  console.log(`✅ Updated: ${updated} classes`);
  console.log(`⏭️  Skipped (already synced): ${skipped} classes`);
  console.log(`⚠️  No sessions: ${noSessions} classes`);
  console.log('====================================\n');

  process.exit(0);
}

syncTotalSessions().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
