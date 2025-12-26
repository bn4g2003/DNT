/**
 * Script để sync nợ hợp đồng từ contracts -> students
 * Chạy 1 lần để fix data cũ
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBU6rvGPdWKqyYZZZcVaDfLbbhXD-PbfeM",
  authDomain: "edumanager-pro-6180f.firebaseapp.com",
  projectId: "edumanager-pro-6180f",
  storageBucket: "edumanager-pro-6180f.firebasestorage.app",
  messagingSenderId: "629803644498",
  appId: "1:629803644498:web:f98cee55c2f6ab2eb2f7c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncContractDebt() {
  console.log('=== Syncing Contract Debt to Students ===\n');

  // Get all contracts with status "Nợ hợp đồng"
  const contractsQuery = query(
    collection(db, 'contracts'),
    where('status', '==', 'Nợ hợp đồng')
  );
  
  const contractsSnap = await getDocs(contractsQuery);
  console.log(`Found ${contractsSnap.size} contracts with "Nợ hợp đồng" status\n`);

  let updated = 0;
  let errors = 0;

  for (const contractDoc of contractsSnap.docs) {
    const contract = contractDoc.data();
    const studentId = contract.studentId;
    
    if (!studentId) {
      console.log(`⚠️ Contract ${contractDoc.id} has no studentId, skipping...`);
      continue;
    }

    console.log(`Processing: ${contract.studentName || studentId}`);
    console.log(`  - Remaining: ${contract.remainingAmount?.toLocaleString()}đ`);
    console.log(`  - Next Payment: ${contract.nextPaymentDate || 'Not set'}`);

    try {
      await updateDoc(doc(db, 'students', studentId), {
        status: 'Nợ hợp đồng',
        contractDebt: contract.remainingAmount || 0,
        nextPaymentDate: contract.nextPaymentDate || null,
      });
      console.log(`  ✅ Updated student successfully\n`);
      updated++;
    } catch (err: any) {
      console.log(`  ❌ Error: ${err.message}\n`);
      errors++;
    }
  }

  console.log('=== Summary ===');
  console.log(`Total contracts: ${contractsSnap.size}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);
}

syncContractDebt().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
