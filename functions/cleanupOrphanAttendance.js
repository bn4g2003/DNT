/**
 * Cleanup orphan attendance records (attendance without studentAttendance)
 * 
 * Usage:
 *   cd functions
 *   node cleanupOrphanAttendance.js        # List only (dry run)
 *   node cleanupOrphanAttendance.js --delete  # Actually delete
 */

const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'edumanager-pro-6180f' });
const db = admin.firestore();

const DELETE_MODE = process.argv.includes('--delete');

async function cleanup() {
  console.log(DELETE_MODE ? '🗑️ DELETE MODE' : '👀 DRY RUN (add --delete to actually delete)');
  console.log('='.repeat(50) + '\n');
  
  const attSnap = await db.collection('attendance').get();
  console.log(`Total attendance records: ${attSnap.size}\n`);
  
  const orphans = [];
  
  for (const doc of attSnap.docs) {
    const att = doc.data();
    
    // Check if has student attendance
    const studentsSnap = await db.collection('studentAttendance')
      .where('attendanceId', '==', doc.id)
      .limit(1)
      .get();
    
    if (studentsSnap.empty) {
      orphans.push({
        id: doc.id,
        className: att.className,
        date: att.date,
        present: att.present,
        absent: att.absent,
        createdAt: att.createdAt
      });
    }
  }
  
  console.log(`Found ${orphans.length} orphan records (no student data):\n`);
  
  orphans.forEach(o => {
    console.log(`  ${o.id}`);
    console.log(`    Class: ${o.className} | Date: ${o.date}`);
    console.log(`    Present: ${o.present}, Absent: ${o.absent}`);
    console.log(`    Created: ${o.createdAt}\n`);
  });
  
  if (DELETE_MODE && orphans.length > 0) {
    console.log('Deleting...');
    for (const o of orphans) {
      await db.collection('attendance').doc(o.id).delete();
      console.log(`  ✅ Deleted ${o.id}`);
    }
    console.log('\n🎉 Done!');
  } else if (orphans.length > 0) {
    console.log('Run with --delete to remove these records');
  } else {
    console.log('✅ No orphan records found!');
  }
  
  process.exit(0);
}

cleanup().catch(console.error);
