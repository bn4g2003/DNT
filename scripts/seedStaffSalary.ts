import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCgjkomzDSqFfVnNJkEfWsbR2PE0cVJp0M",
  authDomain: "edumanager-pro-6180f.firebaseapp.com",
  projectId: "edumanager-pro-6180f",
  storageBucket: "edumanager-pro-6180f.firebasestorage.app",
  messagingSenderId: "649231512346",
  appId: "1:649231512346:web:c0bb12e63a9e17f4b13886"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

async function seed() {
  // Staff Salaries
  const salaries = [
    { staffId: 'NV001', staffName: 'Phạm Văn Sale', position: 'Tư vấn viên', month, year, baseSalary: 6000000, workDays: 24, commission: 2500000, allowance: 500000, deduction: 0, totalSalary: 9000000 },
    { staffId: 'NV002', staffName: 'Lê Thị Hoa', position: 'Lễ tân', month, year, baseSalary: 5500000, workDays: 26, commission: 500000, allowance: 300000, deduction: 100000, totalSalary: 6200000 },
    { staffId: 'NV003', staffName: 'Trần Minh Kế', position: 'Kế toán', month, year, baseSalary: 8000000, workDays: 25, commission: 0, allowance: 500000, deduction: 0, totalSalary: 8500000 },
  ];

  for (const s of salaries) {
    await addDoc(collection(db, 'staffSalaries'), s);
    console.log('Added salary:', s.staffName);
  }

  // Attendance
  const attendance = [
    { staffId: 'NV001', date: '01/12/2024', checkIn: '08:00', checkOut: '17:30', status: 'Đúng giờ' },
    { staffId: 'NV001', date: '02/12/2024', checkIn: '08:15', checkOut: '17:30', status: 'Đi muộn', note: 'Kẹt xe' },
    { staffId: 'NV001', date: '03/12/2024', checkIn: '07:55', checkOut: '17:35', status: 'Đúng giờ' },
    { staffId: 'NV002', date: '01/12/2024', checkIn: '07:45', checkOut: '17:30', status: 'Đúng giờ' },
    { staffId: 'NV002', date: '02/12/2024', checkIn: '07:50', checkOut: '16:00', status: 'Về sớm', note: 'Việc gia đình' },
  ];

  for (const a of attendance) {
    await addDoc(collection(db, 'staffAttendance'), a);
    console.log('Added attendance:', a.staffId, a.date);
  }

  console.log('Done!');
  process.exit(0);
}

seed();
