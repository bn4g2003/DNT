/**
 * Script to create admin staff document in Firestore
 * Run: node scripts/create-admin-staff.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
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
console.log('Project ID:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createAdminStaff() {
  try {
    // Get admin UID from command line argument
    const adminUID = process.argv[2];
    
    if (!adminUID) {
      console.error('❌ Error: Please provide admin UID as argument');
      console.log('\nUsage: node scripts/create-admin-staff.js <ADMIN_UID>');
      console.log('\nTo get UID:');
      console.log('1. Go to Firebase Console → Authentication');
      console.log('2. Find your admin user');
      console.log('3. Copy the UID column value');
      console.log('4. Run: node scripts/create-admin-staff.js YOUR_UID');
      process.exit(1);
    }

    console.log('\n📝 Creating staff document for UID:', adminUID);

    const staffData = {
      uid: adminUID,
      email: 'admin@edumanager.com',  // Thay đổi email ở đây
      name: 'Admin System',  // Thay đổi tên ở đây
      code: 'AD001',
      role: 'Quản trị viên',
      department: 'Quản lý',
      position: 'Quản trị viên',
      phone: '0123456789',  // Thay đổi số điện thoại ở đây
      status: 'Active',
      permissions: {
        canManageStudents: true,
        canManageClasses: true,
        canManageStaff: true,
        canManageFinance: true,
        canViewReports: true,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Create staff document with UID as document ID
    const staffRef = doc(db, 'staff', adminUID);
    await setDoc(staffRef, staffData);

    console.log('✅ Success! Admin staff document created!');
    console.log('\n📊 Document Details:');
    console.log('Collection: staff');
    console.log('Document ID:', adminUID);
    console.log('Email:', staffData.email);
    console.log('Role:', staffData.role);
    console.log('\n🎉 You can now login with:');
    console.log('Email: admin@edumanager.com');
    console.log('Password: [your password]');
    console.log('\n✨ Run: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating staff document:', error);
    process.exit(1);
  }
}

createAdminStaff();
