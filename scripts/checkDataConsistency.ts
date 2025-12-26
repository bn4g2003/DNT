/**
 * Data Consistency Check Script
 * Run: npx ts-node scripts/checkDataConsistency.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "edumanager-pro-6180f.firebaseapp.com",
  projectId: "edumanager-pro-6180f",
  storageBucket: "edumanager-pro-6180f.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxxxxxx"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface ConsistencyIssue {
  type: 'orphaned_reference' | 'data_mismatch' | 'missing_field';
  collection: string;
  documentId: string;
  field: string;
  currentValue: any;
  expectedValue?: any;
  description: string;
}

async function checkConsistency() {
  console.log('='.repeat(60));
  console.log('DATA CONSISTENCY CHECK');
  console.log('='.repeat(60));
  console.log('Started at:', new Date().toISOString());
  console.log('');

  const issues: ConsistencyIssue[] = [];

  try {
    // Fetch all data
    console.log('Fetching data from Firebase...');
    const [studentsSnap, classesSnap, parentsSnap, staffSnap] = await Promise.all([
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'classes')),
      getDocs(collection(db, 'parents')),
      getDocs(collection(db, 'staff')),
    ]);

    console.log(`Found: ${studentsSnap.size} students, ${classesSnap.size} classes, ${parentsSnap.size} parents, ${staffSnap.size} staff`);
    console.log('');

    // Create lookup maps
    const classesMap = new Map(classesSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]));
    const parentsMap = new Map(parentsSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]));
    const staffMap = new Map(staffSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]));

    // Check students
    console.log('Checking students...');
    for (const docSnap of studentsSnap.docs) {
      const student = docSnap.data();
      const studentId = docSnap.id;
      const studentName = student.fullName || student.name || studentId;

      // Check orphaned classId
      if (student.classId && !classesMap.has(student.classId)) {
        issues.push({
          type: 'orphaned_reference',
          collection: 'students',
          documentId: studentId,
          field: 'classId',
          currentValue: student.classId,
          description: `Student "${studentName}" references non-existent class (${student.classId})`,
        });
      }

      // Check orphaned parentId
      if (student.parentId && !parentsMap.has(student.parentId)) {
        issues.push({
          type: 'orphaned_reference',
          collection: 'students',
          documentId: studentId,
          field: 'parentId',
          currentValue: student.parentId,
          description: `Student "${studentName}" references non-existent parent (${student.parentId})`,
        });
      }

      // Check parentName mismatch
      if (student.parentId && parentsMap.has(student.parentId)) {
        const parent: any = parentsMap.get(student.parentId);
        if (parent?.name && student.parentName && parent.name !== student.parentName) {
          issues.push({
            type: 'data_mismatch',
            collection: 'students',
            documentId: studentId,
            field: 'parentName',
            currentValue: student.parentName,
            expectedValue: parent.name,
            description: `Student "${studentName}" has mismatched parentName: "${student.parentName}" vs "${parent.name}"`,
          });
        }
      }

      // Check className mismatch
      if (student.classId && classesMap.has(student.classId)) {
        const cls: any = classesMap.get(student.classId);
        const studentClassName = student.className || student.class;
        if (cls?.name && studentClassName && cls.name !== studentClassName) {
          issues.push({
            type: 'data_mismatch',
            collection: 'students',
            documentId: studentId,
            field: 'className',
            currentValue: studentClassName,
            expectedValue: cls.name,
            description: `Student "${studentName}" has mismatched className: "${studentClassName}" vs "${cls.name}"`,
          });
        }
      }

      // Check missing required fields
      if (!student.fullName && !student.name) {
        issues.push({
          type: 'missing_field',
          collection: 'students',
          documentId: studentId,
          field: 'fullName',
          currentValue: null,
          description: `Student ${studentId} is missing name field`,
        });
      }
    }

    // Check classes
    console.log('Checking classes...');
    for (const docSnap of classesSnap.docs) {
      const cls = docSnap.data();
      const classId = docSnap.id;

      // Check orphaned teacherId
      if (cls.teacherId && !staffMap.has(cls.teacherId)) {
        issues.push({
          type: 'orphaned_reference',
          collection: 'classes',
          documentId: classId,
          field: 'teacherId',
          currentValue: cls.teacherId,
          description: `Class "${cls.name}" references non-existent teacher (${cls.teacherId})`,
        });
      }
    }

    // Print results
    console.log('');
    console.log('='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));

    const orphaned = issues.filter(i => i.type === 'orphaned_reference');
    const mismatches = issues.filter(i => i.type === 'data_mismatch');
    const missing = issues.filter(i => i.type === 'missing_field');

    console.log(`Total Issues: ${issues.length}`);
    console.log(`  - Orphaned References: ${orphaned.length}`);
    console.log(`  - Data Mismatches: ${mismatches.length}`);
    console.log(`  - Missing Fields: ${missing.length}`);
    console.log('');

    if (issues.length > 0) {
      console.log('ISSUES DETAIL:');
      console.log('-'.repeat(60));

      if (orphaned.length > 0) {
        console.log('\n[ORPHANED REFERENCES]');
        orphaned.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue.description}`);
          console.log(`     Collection: ${issue.collection}, Doc: ${issue.documentId}`);
        });
      }

      if (mismatches.length > 0) {
        console.log('\n[DATA MISMATCHES]');
        mismatches.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue.description}`);
          console.log(`     Collection: ${issue.collection}, Doc: ${issue.documentId}`);
        });
      }

      if (missing.length > 0) {
        console.log('\n[MISSING FIELDS]');
        missing.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue.description}`);
        });
      }

      console.log('');
      console.log('To fix these issues, run:');
      console.log('  npx ts-node scripts/fixDataConsistency.ts');
    } else {
      console.log('No issues found! Database is consistent.');
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('Completed at:', new Date().toISOString());

  } catch (error) {
    console.error('Error checking consistency:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkConsistency();
