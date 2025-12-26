// Quick sync script - run from functions folder: node syncSessions.js
const admin = require('firebase-admin');

// Initialize with default credentials
admin.initializeApp({
  projectId: 'edumanager-pro-6180f'
});

const db = admin.firestore();

const classesToUpdate = [
  { id: 'xLnaOgHbLE25C0urtMAz', name: 'Advanced A', sessions: 26 },
  { id: 'xdwPmXqZQ3G3k8rxgDx8', name: 'Elementary 1A', sessions: 39 },
  { id: 'cISfgKvfs5IaN7OSeBHb', name: 'Elementary 2A', sessions: 13 },
  { id: 'mneRXDZcjiC5nWOGvbLM', name: 'Intermediate B', sessions: 39 },
  { id: 'obWNDRQ3jT6Zxf8U39ar', name: 'Kindy 1A', sessions: 26 },
  { id: 'xBi5I3M9rNcwYZiEfrQu', name: 'Kindy 2A', sessions: 26 },
  { id: '77x6PYa7z4iEgVDJcX5U', name: 'Starter 1A', sessions: 39 },
  { id: 'bADE6K6i3JhUe9xofa1j', name: 'Starter 1B', sessions: 39 },
  { id: 'dMJ1E1CXqPGfSPwmfHzz', name: 'Starter 2A', sessions: 39 },
  { id: 'UfWyAQeMAR0IwNR3fUem', name: 'Tiếng Anh Mover', sessions: 26 },
];

async function syncAll() {
  console.log('Starting sync...\n');
  
  for (const cls of classesToUpdate) {
    try {
      await db.collection('classes').doc(cls.id).update({
        totalSessions: cls.sessions,
        progress: `0/${cls.sessions}`,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ ${cls.name}: totalSessions = ${cls.sessions}`);
    } catch (err) {
      console.error(`❌ ${cls.name}: ${err.message}`);
    }
  }
  
  console.log('\nDone!');
  process.exit(0);
}

syncAll();
