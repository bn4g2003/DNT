/**
 * Script to generate class sessions for all existing classes
 * Run: npx vite-node scripts/generateSessions.ts
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  query,
  where,
  writeBatch,
  doc,
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

// Day mapping
const DAY_MAP: Record<string, number> = {
  'chủ nhật': 0, 'cn': 0,
  'thứ 2': 1, 'thứ hai': 1, 't2': 1,
  'thứ 3': 2, 'thứ ba': 2, 't3': 2,
  'thứ 4': 3, 'thứ tư': 3, 't4': 3,
  'thứ 5': 4, 'thứ năm': 4, 't5': 4,
  'thứ 6': 5, 'thứ sáu': 5, 't6': 5,
  'thứ 7': 6, 'thứ bảy': 6, 't7': 6,
};

// Active statuses that should have sessions generated
const ACTIVE_STATUSES = ['Đang học', 'Đang hoạt động', 'Active', 'active'];

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

function parseScheduleDays(schedule: string): number[] {
  if (!schedule) return [];
  
  const scheduleLower = schedule.toLowerCase();
  const days: Set<number> = new Set();
  
  // Check for standard day names
  for (const [dayName, dayNum] of Object.entries(DAY_MAP)) {
    if (scheduleLower.includes(dayName)) {
      days.add(dayNum);
    }
  }
  
  // Parse T2-T4-T6 or T2, T4, T6 format (very common)
  const tMatches = schedule.match(/T([2-7])/gi);
  if (tMatches) {
    tMatches.forEach(match => {
      const n = parseInt(match.substring(1));
      if (n >= 2 && n <= 7) {
        days.add(n === 7 ? 6 : n - 1); // Convert to JS day (0=Sunday)
      }
    });
  }
  
  // Parse standalone numbers like "2, 4, 6" (fallback)
  if (days.size === 0) {
    const numberMatches = schedule.match(/\b([2-7])\b/g);
    if (numberMatches) {
      numberMatches.forEach(num => {
        const n = parseInt(num);
        if (n >= 2 && n <= 7) {
          days.add(n === 7 ? 6 : n - 1);
        }
      });
    }
  }
  
  return Array.from(days).sort();
}

function parseScheduleTime(schedule: string): string | null {
  if (!schedule) return null;
  
  // Match time range like "18:00-19:30" or "17:30 - 19:00"
  const timeRangeMatch = schedule.match(/(\d{1,2})[h:](\d{2})?\s*[-–]\s*(\d{1,2})[h:](\d{2})?/);
  if (timeRangeMatch) {
    const startHour = timeRangeMatch[1].padStart(2, '0');
    const startMin = (timeRangeMatch[2] || '00').padStart(2, '0');
    const endHour = timeRangeMatch[3].padStart(2, '0');
    const endMin = (timeRangeMatch[4] || '00').padStart(2, '0');
    return `${startHour}:${startMin}-${endHour}:${endMin}`;
  }
  
  // Match single time like "18:00" or "17:30" (assume 1.5 hour class)
  const singleTimeMatch = schedule.match(/(\d{1,2})[h:](\d{2})/);
  if (singleTimeMatch) {
    const startHour = parseInt(singleTimeMatch[1]);
    const startMin = parseInt(singleTimeMatch[2] || '0');
    const endHour = startHour + 1;
    const endMin = startMin + 30;
    return `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}-${String(endMin >= 60 ? endHour + 1 : endHour).padStart(2, '0')}:${String(endMin >= 60 ? endMin - 60 : endMin).padStart(2, '0')}`;
  }
  
  return null;
}

interface ClassData {
  id: string;
  name: string;
  schedule?: string;
  startDate?: string;
  endDate?: string;
  room?: string;
  teacherId?: string;
  teacherName?: string;
  status?: string;
}

async function generateSessions() {
  try {
    console.log('\n📊 Fetching classes...');
    
    const classesSnapshot = await getDocs(collection(db, 'classes'));
    const classes: ClassData[] = classesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClassData));
    
    console.log(`Found ${classes.length} classes`);
    
    // Check existing sessions
    const existingSessionsSnapshot = await getDocs(collection(db, 'classSessions'));
    const existingClassIds = new Set(
      existingSessionsSnapshot.docs.map(doc => doc.data().classId)
    );
    console.log(`Found ${existingClassIds.size} classes with existing sessions`);
    
    // Filter to active classes without sessions
    const classesToProcess = classes.filter(c => 
      ACTIVE_STATUSES.includes(c.status || '') && 
      c.schedule && 
      !existingClassIds.has(c.id)
    );
    
    console.log(`\n🔄 Processing ${classesToProcess.length} classes without sessions...\n`);
    
    let totalSessions = 0;
    
    for (const cls of classesToProcess) {
      console.log(`\n📚 Class: ${cls.name}`);
      console.log(`   Schedule: ${cls.schedule}`);
      
      const scheduleDays = parseScheduleDays(cls.schedule || '');
      if (scheduleDays.length === 0) {
        console.log(`   ❌ Could not parse schedule`);
        continue;
      }
      
      console.log(`   Days: ${scheduleDays.map(d => DAY_NAMES[d]).join(', ')}`);
      
      const time = parseScheduleTime(cls.schedule || '');
      console.log(`   Time: ${time || 'Not specified'}`);
      
      // Generate sessions for next 3 months
      const fromDate = new Date();
      const toDate = new Date();
      toDate.setMonth(toDate.getMonth() + 3);
      
      const sessions: any[] = [];
      let currentDate = new Date(fromDate);
      let sessionNumber = 1;
      const maxSessions = 50;
      
      while (currentDate <= toDate && sessionNumber <= maxSessions) {
        const dayOfWeek = currentDate.getDay();
        
        if (scheduleDays.includes(dayOfWeek)) {
          sessions.push({
            classId: cls.id,
            className: cls.name,
            sessionNumber,
            date: currentDate.toISOString().split('T')[0],
            dayOfWeek: DAY_NAMES[dayOfWeek],
            time: time || null,
            room: cls.room || null,
            teacherId: cls.teacherId || null,
            teacherName: cls.teacherName || null,
            status: 'Chưa học',
            createdAt: new Date().toISOString(),
          });
          sessionNumber++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`   Generated: ${sessions.length} sessions`);
      
      // Save to Firestore
      if (sessions.length > 0) {
        const batch = writeBatch(db);
        for (const session of sessions) {
          const docRef = doc(collection(db, 'classSessions'));
          batch.set(docRef, session);
        }
        await batch.commit();
        totalSessions += sessions.length;
        console.log(`   ✅ Saved to Firestore`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   Classes processed: ${classesToProcess.length}`);
    console.log(`   Total sessions created: ${totalSessions}`);
    console.log('\n✅ Done!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateSessions();
