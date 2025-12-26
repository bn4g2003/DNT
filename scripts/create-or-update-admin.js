/**
 * Script to create or update admin staff
 * Usage: 
 *   node scripts/create-or-update-admin.js <UID> [email]
 * 
 * Example:
 *   node scripts/create-or-update-admin.js abc123xyz sangquang2904@gmail.com
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
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

async function createOrUpdateAdmin() {
  try {
    const uid = process.argv[2];
    const email = process.argv[3] || 'sangquang2904@gmail.com';
    
    if (!uid) {
      console.log('❌ Please provide UID');
      console.log('\n📖 Usage: node scripts/create-or-update-admin.js <UID> [email]');
      console.log('\n📍 To get UID:');
      console.log('   1. Go to Firebase Console → Authentication');
      console.log('   2. Find user with email: sangquang2904@gmail.com');
      console.log('   3. Copy the "User UID" column value');
      console.log('   4. Run: node scripts/create-or-update-admin.js <paste-uid-here>');
      process.exit(1);
    }

    console.log(`\n🔍 Checking staff document for UID: ${uid}`);
    
    const staffRef = doc(db, 'staff', uid);
    const existing = await getDoc(staffRef);
    
    const staffData = {
      uid: uid,
      email: email,
      name: 'Admin',
      code: 'AD001',
      role: 'Quản trị viên',
      department: 'Quản lý',
      position: 'Quản trị viên',
      phone: '0123456789',
      status: 'Active',
      permissions: {
        canManageStudents: true,
        canManageClasses: true,
        canManageStaff: true,
        canManageFinance: true,
        canViewReports: true,
      },
      updatedAt: Timestamp.now(),
    };

    if (existing.exists()) {
      console.log('\n📊 Existing staff found, updating to Admin...');
      const currentData = existing.data();
      console.log(`   Current Name: ${currentData.name}`);
      console.log(`   Current Position: ${currentData.position}`);
      
      // Keep existing data, just update position/role
      await setDoc(staffRef, {
        ...currentData,
        position: 'Quản trị viên',
        role: 'Quản trị viên',
        department: 'Quản lý',
        permissions: staffData.permissions,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } else {
      console.log('\n📝 No staff document found, creating new Admin...');
      staffData.createdAt = Timestamp.now();
      await setDoc(staffRef, staffData);
    }

    console.log('\n✅ Success!');
    console.log('   Position: Quản trị viên');
    console.log('   Role: Quản trị viên');
    console.log(`   Email: ${email}`);
    console.log('\n🎉 Refresh app and login again!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createOrUpdateAdmin();
