import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function main() {
  // Get all classes
  const classesSnap = await getDocs(collection(db, 'classes'));
  console.log('=== ALL CLASSES ===');
  classesSnap.docs.forEach(doc => {
    const d = doc.data();
    console.log(`${doc.id} | ${d.name} | Schedule: "${d.schedule || 'NONE'}" | ${d.status}`);
  });

  // Get sessions
  const sessionsSnap = await getDocs(collection(db, 'classSessions'));
  const classesWithSessions = new Set<string>();
  sessionsSnap.docs.forEach(d => classesWithSessions.add(d.data().classId));
  
  console.log('\n=== CLASSES WITH SESSIONS ===');
  console.log([...classesWithSessions]);
  
  console.log('\n=== CLASSES WITHOUT SESSIONS ===');
  classesSnap.docs.forEach(doc => {
    if (!classesWithSessions.has(doc.id)) {
      const d = doc.data();
      console.log(`${doc.id} | ${d.name} | Schedule: "${d.schedule || 'NONE'}"`);
    }
  });
}

main().then(() => process.exit(0));
