/**
 * Script to update staff position to Admin
 * Run: node scripts/update-admin-position.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAdminPosition() {
  try {
    const email = process.argv[2] || 'sangquang2904@gmail.com';
    
    console.log(`\n🔍 Finding staff with email: ${email}`);
    
    // Find staff by email
    const staffQuery = query(
      collection(db, 'staff'),
      where('email', '==', email)
    );
    const snapshot = await getDocs(staffQuery);
    
    if (snapshot.empty) {
      console.log('❌ No staff found with this email');
      console.log('\nTrying to find by checking all staff documents...');
      
      // List all staff
      const allStaff = await getDocs(collection(db, 'staff'));
      console.log('\n📋 All staff in database:');
      allStaff.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.email || data.name} | position: ${data.position}`);
      });
      
      process.exit(1);
    }
    
    // Update position
    const staffDoc = snapshot.docs[0];
    const currentData = staffDoc.data();
    
    console.log('\n📊 Current staff data:');
    console.log(`  ID: ${staffDoc.id}`);
    console.log(`  Name: ${currentData.name}`);
    console.log(`  Email: ${currentData.email}`);
    console.log(`  Current Position: ${currentData.position}`);
    console.log(`  Current Role: ${currentData.role}`);
    
    // Update to Admin
    await updateDoc(doc(db, 'staff', staffDoc.id), {
      position: 'Quản trị viên',
      role: 'Quản trị viên',
      department: 'Quản lý',
      permissions: {
        canManageStudents: true,
        canManageClasses: true,
        canManageStaff: true,
        canManageFinance: true,
        canViewReports: true,
      },
    });
    
    console.log('\n✅ Updated successfully!');
    console.log('  New Position: Quản trị viên');
    console.log('  New Role: Quản trị viên');
    console.log('\n🎉 Please refresh the app and login again!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAdminPosition();
