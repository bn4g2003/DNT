/**
 * Script: Kiểm tra và gán lớp ngẫu nhiên cho học viên chưa có lớp
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

async function main() {
  console.log('=== KIỂM TRA VÀ GÁN LỚP CHO HỌC VIÊN ===\n');

  // 1. Fetch all classes
  console.log('1. Đang tải danh sách lớp...');
  const classesSnap = await getDocs(collection(db, 'classes'));
  const classes = classesSnap.docs.map(doc => ({ 
    id: doc.id, 
    name: (doc.data() as any).name,
    status: (doc.data() as any).status 
  }));
  
  // Filter only active classes
  const activeClasses = classes.filter(c => 
    c.status === 'Đang học' || c.status === 'Active' || c.status === 'Đang hoạt động'
  );
  
  console.log(`   Tổng số lớp: ${classes.length}`);
  console.log(`   Lớp đang hoạt động: ${activeClasses.length}`);
  console.log('   Danh sách lớp:');
  activeClasses.forEach(c => console.log(`   - ${c.name} (${c.id})`));

  // 2. Fetch all students
  console.log('\n2. Đang tải danh sách học viên...');
  const studentsSnap = await getDocs(collection(db, 'students'));
  const students = studentsSnap.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as any[];
  
  console.log(`   Tổng số học viên: ${students.length}`);

  // 3. Categorize students
  const studentsWithClass: any[] = [];
  const studentsWithoutClass: any[] = [];
  const statusCounts: Record<string, number> = {};

  students.forEach(student => {
    const hasClass = student.classId || student.class || student.className;
    const status = student.status || 'Unknown';
    
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    
    if (hasClass) {
      studentsWithClass.push(student);
    } else {
      studentsWithoutClass.push(student);
    }
  });

  console.log(`\n3. Phân tích học viên:`);
  console.log(`   Có lớp: ${studentsWithClass.length}`);
  console.log(`   Chưa có lớp: ${studentsWithoutClass.length}`);
  
  console.log('\n   Thống kê theo trạng thái:');
  Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    console.log(`   - ${status}: ${count}`);
  });

  // 4. List students without class
  if (studentsWithoutClass.length > 0) {
    console.log('\n4. Danh sách học viên chưa có lớp:');
    studentsWithoutClass.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.fullName || s.name || 'N/A'} - Status: ${s.status || 'N/A'}`);
    });

    // 5. Assign classes randomly
    console.log('\n5. Đang gán lớp ngẫu nhiên...');
    
    if (activeClasses.length === 0) {
      console.log('   ⚠️ Không có lớp nào đang hoạt động để gán!');
      return;
    }

    let assigned = 0;
    for (const student of studentsWithoutClass) {
      // Pick a random class
      const randomClass = activeClasses[Math.floor(Math.random() * activeClasses.length)];
      
      try {
        await updateDoc(doc(db, 'students', student.id), {
          classId: randomClass.id,
          class: randomClass.name
        });
        assigned++;
        console.log(`   ✓ ${student.fullName || student.name} → ${randomClass.name}`);
      } catch (err) {
        console.error(`   ✗ Lỗi khi gán lớp cho ${student.fullName || student.name}:`, err);
      }
    }

    console.log(`\n   Đã gán lớp cho ${assigned}/${studentsWithoutClass.length} học viên.`);
  } else {
    console.log('\n4. Tất cả học viên đã có lớp!');
  }

  // 6. Final summary
  console.log('\n=== HOÀN TẤT ===');
  console.log(`Tổng học viên: ${students.length}`);
  console.log(`Đã có lớp trước: ${studentsWithClass.length}`);
  console.log(`Vừa gán lớp: ${studentsWithoutClass.length}`);
}

main().catch(console.error);
