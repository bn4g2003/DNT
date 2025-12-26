/**
 * Debug Attendance Data
 * Kiểm tra data integrity của attendance records
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCz0DG-cggJRbmL7ad0b3YxvAVwvJcvRKY",
  authDomain: "edumanager-pro-6180f.firebaseapp.com",
  projectId: "edumanager-pro-6180f",
  storageBucket: "edumanager-pro-6180f.firebasestorage.app",
  messagingSenderId: "651206612472",
  appId: "1:651206612472:web:d73c9c535b5c827d4b7c09"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugAttendance() {
  console.log('=== DEBUG ATTENDANCE DATA ===\n');

  // 1. Get all classes
  console.log('1. Loading classes...');
  const classesSnap = await getDocs(collection(db, 'classes'));
  const classes = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`   Found ${classes.length} classes`);
  
  const classIds = new Set(classes.map(c => c.id));
  const classNames = new Set(classes.map(c => (c as any).name));
  
  console.log('\n   Class list:');
  classes.forEach((c: any) => {
    console.log(`   - ${c.name} (ID: ${c.id})`);
  });

  // 2. Get all attendance records
  console.log('\n2. Loading attendance records...');
  const attendanceSnap = await getDocs(collection(db, 'attendance'));
  const records = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`   Found ${records.length} attendance records`);

  // 3. Analyze records
  console.log('\n3. Analyzing records...');
  
  let validClassId = 0;
  let invalidClassId = 0;
  let missingClassName = 0;
  let validClassName = 0;
  const orphanedRecords: any[] = [];
  const uniqueClassIds = new Set<string>();
  const uniqueClassNames = new Set<string>();

  records.forEach((record: any) => {
    uniqueClassIds.add(record.classId);
    if (record.className) uniqueClassNames.add(record.className);
    
    if (classIds.has(record.classId)) {
      validClassId++;
    } else {
      invalidClassId++;
      orphanedRecords.push({
        id: record.id,
        classId: record.classId,
        className: record.className || record.class || record.classname || 'MISSING',
        date: record.date,
      });
    }
    
    if (!record.className) {
      missingClassName++;
    } else if (classNames.has(record.className)) {
      validClassName++;
    }
  });

  console.log(`\n   Records with valid classId: ${validClassId}`);
  console.log(`   Records with INVALID classId: ${invalidClassId}`);
  console.log(`   Records missing className: ${missingClassName}`);
  console.log(`   Records with valid className: ${validClassName}`);

  // 4. Show unique classIds in attendance that don't exist in classes
  console.log('\n4. Unique classIds in attendance NOT in classes collection:');
  let orphanCount = 0;
  uniqueClassIds.forEach(id => {
    if (!classIds.has(id)) {
      orphanCount++;
      const count = records.filter((r: any) => r.classId === id).length;
      const sample = records.find((r: any) => r.classId === id);
      console.log(`   - ${id}: ${count} records (className: ${(sample as any)?.className || 'N/A'})`);
    }
  });
  if (orphanCount === 0) console.log('   None! All classIds are valid.');

  // 5. Check specific case: Intermediate B on 2025-12-06
  console.log('\n5. Checking specific case: Intermediate B on 2025-12-06...');
  
  // Find Intermediate B class
  const intermediateB = classes.find((c: any) => c.name === 'Intermediate B');
  if (intermediateB) {
    console.log(`   Found class: ${(intermediateB as any).name} (ID: ${intermediateB.id})`);
    
    // Check for attendance on that date
    const matchingRecords = records.filter((r: any) => 
      r.classId === intermediateB.id && r.date === '2025-12-06'
    );
    console.log(`   Attendance records for 2025-12-06: ${matchingRecords.length}`);
    matchingRecords.forEach((r: any) => {
      console.log(`   - ID: ${r.id}, className: ${r.className}, date: ${r.date}`);
    });
    
    // Also check if there are records with same date but different classId containing "Intermediate"
    const relatedRecords = records.filter((r: any) => 
      r.date === '2025-12-06' && (
        r.className?.includes('Intermediate') || 
        r.classId?.includes('intermediate')
      )
    );
    console.log(`\n   All records on 2025-12-06 related to "Intermediate":`);
    relatedRecords.forEach((r: any) => {
      console.log(`   - ID: ${r.id}, classId: ${r.classId}, className: ${r.className}`);
    });
  } else {
    console.log('   Class "Intermediate B" not found!');
  }

  // 6. Show first 10 orphaned records
  console.log('\n6. Sample of orphaned records (first 10):');
  orphanedRecords.slice(0, 10).forEach(r => {
    console.log(`   - Date: ${r.date}, ClassId: ${r.classId}, ClassName: ${r.className}`);
  });

  // 7. Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total classes: ${classes.length}`);
  console.log(`Total attendance records: ${records.length}`);
  console.log(`Records linked to existing classes: ${validClassId} (${(validClassId/records.length*100).toFixed(1)}%)`);
  console.log(`Orphaned records (classId not found): ${invalidClassId} (${(invalidClassId/records.length*100).toFixed(1)}%)`);
  
  if (invalidClassId > 0) {
    console.log('\n⚠️  DATA INTEGRITY ISSUE DETECTED!');
    console.log('   Many attendance records reference classes that no longer exist.');
    console.log('   This causes the mismatch between Attendance check and AttendanceHistory display.');
  }
}

debugAttendance().catch(console.error);
