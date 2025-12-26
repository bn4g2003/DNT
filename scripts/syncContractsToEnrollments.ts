/**
 * Script to sync existing contracts to enrollments collection
 * Run: npx ts-node scripts/syncContractsToEnrollments.ts
 * Or: npx vite-node scripts/syncContractsToEnrollments.ts
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
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

interface Contract {
  id: string;
  code: string;
  studentId?: string;
  studentName: string;
  items: Array<{
    type: string;
    quantity: number;
  }>;
  subtotal: number;
  totalAmount: number;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

async function syncContractsToEnrollments() {
  try {
    console.log('\n📊 Fetching existing contracts...');
    
    // Get all contracts
    const contractsSnapshot = await getDocs(collection(db, 'contracts'));
    const contracts: Contract[] = contractsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Contract));
    
    console.log(`Found ${contracts.length} contracts`);
    
    if (contracts.length === 0) {
      console.log('No contracts to sync');
      process.exit(0);
    }
    
    // Get existing enrollments
    const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
    const existingContractCodes = new Set(
      enrollmentsSnapshot.docs.map(doc => doc.data().contractCode).filter(Boolean)
    );
    
    console.log(`Found ${existingContractCodes.size} existing enrollments with contract codes`);
    
    // Count contracts per student for determining type
    const studentContractCount: Record<string, number> = {};
    contracts.forEach(c => {
      if (c.studentId) {
        studentContractCount[c.studentId] = (studentContractCount[c.studentId] || 0) + 1;
      }
    });
    
    let created = 0;
    let skipped = 0;
    
    // Sort contracts by date to process oldest first
    contracts.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const processedStudents = new Set<string>();
    
    for (const contract of contracts) {
      // Skip if enrollment already exists for this contract
      if (existingContractCodes.has(contract.code)) {
        console.log(`  ⏭️  Skipping ${contract.code} - enrollment exists`);
        skipped++;
        continue;
      }
      
      // Calculate total sessions from course items
      const totalSessions = (contract.items || []).reduce((sum, item) => {
        if (item.type === 'course') {
          return sum + (item.quantity || 0);
        }
        return sum;
      }, 0);
      
      // Determine enrollment type
      let enrollmentType: 'Hợp đồng mới' | 'Hợp đồng tái phí' = 'Hợp đồng mới';
      if (contract.studentId && processedStudents.has(contract.studentId)) {
        enrollmentType = 'Hợp đồng tái phí';
      }
      if (contract.studentId) {
        processedStudents.add(contract.studentId);
      }
      
      // Format date
      const createdDate = contract.createdAt 
        ? new Date(contract.createdAt).toLocaleDateString('vi-VN')
        : new Date().toLocaleDateString('vi-VN');
      
      const enrollmentData = {
        studentName: contract.studentName || 'Unknown',
        studentId: contract.studentId || '',
        sessions: totalSessions,
        type: enrollmentType,
        contractCode: contract.code,
        contractId: contract.id,
        originalAmount: contract.subtotal || contract.totalAmount || 0,
        finalAmount: contract.totalAmount || 0,
        createdDate: createdDate,
        createdBy: contract.createdBy || 'system',
        staff: contract.createdBy || 'system',
        note: contract.notes || '',
        createdAt: Timestamp.now(),
      };
      
      await addDoc(collection(db, 'enrollments'), enrollmentData);
      console.log(`  ✅ Created enrollment for ${contract.code} - ${contract.studentName}`);
      created++;
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('\n✅ Sync completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

syncContractsToEnrollments();
