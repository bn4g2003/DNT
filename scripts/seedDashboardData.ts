/**
 * Seed Dashboard Test Data
 * Run: npx ts-node scripts/seedDashboardData.ts
 * Or import and call from browser console
 */

import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../src/config/firebase';

const STUDENTS_COLLECTION = 'students';
const FINANCIAL_COLLECTION = 'financialTransactions';
const CLASSES_COLLECTION = 'classes';

// Helper to get current month string
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Helper to get date string for current month
const getDateInMonth = (day: number) => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Test Students Data
const testStudents = [
  // Nợ phí - 12 học viên
  { name: 'Nguyễn Văn An', phone: '0901234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp A1', parentPhone: '0901234568' },
  { name: 'Trần Thị Bình', phone: '0902234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp A1', parentPhone: '0902234568' },
  { name: 'Lê Văn Cường', phone: '0903234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp A2', parentPhone: '0903234568' },
  { name: 'Phạm Thị Dung', phone: '0904234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp A2', parentPhone: '0904234568' },
  { name: 'Hoàng Văn Em', phone: '0905234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp B1', parentPhone: '0905234568' },
  { name: 'Vũ Thị Phương', phone: '0906234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp B1', parentPhone: '0906234568' },
  { name: 'Đặng Văn Giang', phone: '0907234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp B2', parentPhone: '0907234568' },
  { name: 'Bùi Thị Hoa', phone: '0908234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp B2', parentPhone: '0908234568' },
  { name: 'Ngô Văn Hùng', phone: '0909234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp C1', parentPhone: '0909234568' },
  { name: 'Đinh Thị Kim', phone: '0910234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp C1', parentPhone: '0910234568' },
  { name: 'Trương Văn Long', phone: '0911234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp C2', parentPhone: '0911234568' },
  { name: 'Lý Thị Mai', phone: '0912234567', status: 'Nợ phí', hasDebt: true, className: 'Lớp C2', parentPhone: '0912234568' },
  
  // Học thử - 8 học viên
  { name: 'Cao Văn Nam', phone: '0913234567', status: 'Học thử', className: 'Lớp A1', parentPhone: '0913234568' },
  { name: 'Phan Thị Oanh', phone: '0914234567', status: 'Học thử', className: 'Lớp A2', parentPhone: '0914234568' },
  { name: 'Đỗ Văn Phúc', phone: '0915234567', status: 'Học thử', className: 'Lớp B1', parentPhone: '0915234568' },
  { name: 'Hồ Thị Quỳnh', phone: '0916234567', status: 'Học thử', className: 'Lớp B2', parentPhone: '0916234568' },
  { name: 'Tô Văn Rồng', phone: '0917234567', status: 'Học thử', className: 'Lớp C1', parentPhone: '0917234568' },
  { name: 'Chu Thị Sen', phone: '0918234567', status: 'Học thử', className: 'Lớp C2', parentPhone: '0918234568' },
  { name: 'Từ Văn Tài', phone: '0919234567', status: 'Học thử', className: 'Lớp D1', parentPhone: '0919234568' },
  { name: 'Lưu Thị Uyên', phone: '0920234567', status: 'Học thử', className: 'Lớp D1', parentPhone: '0920234568' },
  
  // Bảo lưu - 5 học viên
  { name: 'Mai Văn Vinh', phone: '0921234567', status: 'Bảo lưu', className: 'Lớp A1', parentPhone: '0921234568' },
  { name: 'Dương Thị Xuân', phone: '0922234567', status: 'Bảo lưu', className: 'Lớp A2', parentPhone: '0922234568' },
  { name: 'Kiều Văn Yến', phone: '0923234567', status: 'Bảo lưu', className: 'Lớp B1', parentPhone: '0923234568' },
  { name: 'Tạ Thị Zara', phone: '0924234567', status: 'Bảo lưu', className: 'Lớp B2', parentPhone: '0924234568' },
  { name: 'Quách Văn Anh', phone: '0925234567', status: 'Bảo lưu', className: 'Lớp C1', parentPhone: '0925234568' },
  
  // Nghỉ học - 4 học viên
  { name: 'Trịnh Thị Bích', phone: '0926234567', status: 'Nghỉ học', className: 'Lớp A1', parentPhone: '0926234568' },
  { name: 'Thái Văn Công', phone: '0927234567', status: 'Nghỉ học', className: 'Lớp B1', parentPhone: '0927234568' },
  { name: 'La Thị Diệu', phone: '0928234567', status: 'Nghỉ học', className: 'Lớp C1', parentPhone: '0928234568' },
  { name: 'Mạc Văn Đức', phone: '0929234567', status: 'Nghỉ học', className: 'Lớp D1', parentPhone: '0929234568' },
  
  // HV mới (trong 30 ngày) - 10 học viên - có createdAt gần đây
  { name: 'Âu Thị Én', phone: '0930234567', status: 'Active', className: 'Lớp A1', parentPhone: '0930234568', isNew: true },
  { name: 'Sầm Văn Phong', phone: '0931234567', status: 'Active', className: 'Lớp A2', parentPhone: '0931234568', isNew: true },
  { name: 'Ôn Thị Giang', phone: '0932234567', status: 'Active', className: 'Lớp B1', parentPhone: '0932234568', isNew: true },
  { name: 'Vi Văn Hải', phone: '0933234567', status: 'Active', className: 'Lớp B2', parentPhone: '0933234568', isNew: true },
  { name: 'Nông Thị Ivy', phone: '0934234567', status: 'Active', className: 'Lớp C1', parentPhone: '0934234568', isNew: true },
  { name: 'Giáp Văn Jack', phone: '0935234567', status: 'Active', className: 'Lớp C2', parentPhone: '0935234568', isNew: true },
  { name: 'Ứng Thị Kim', phone: '0936234567', status: 'Active', className: 'Lớp D1', parentPhone: '0936234568', isNew: true },
  { name: 'Doãn Văn Lâm', phone: '0937234567', status: 'Active', className: 'Lớp D2', parentPhone: '0937234568', isNew: true },
  { name: 'Cù Thị Minh', phone: '0938234567', status: 'Active', className: 'Lớp E1', parentPhone: '0938234568', isNew: true },
  { name: 'Khúc Văn Nam', phone: '0939234567', status: 'Active', className: 'Lớp E1', parentPhone: '0939234568', isNew: true },
  
  // Học viên bình thường (Active, không nợ, không mới) - 20+ học viên
  { name: 'Lương Thị Oanh', phone: '0940234567', status: 'Active', className: 'Lớp A1', parentPhone: '0940234568' },
  { name: 'Châu Văn Phát', phone: '0941234567', status: 'Active', className: 'Lớp A1', parentPhone: '0941234568' },
  { name: 'Thi Thị Quế', phone: '0942234567', status: 'Active', className: 'Lớp A2', parentPhone: '0942234568' },
  { name: 'Cung Văn Rạng', phone: '0943234567', status: 'Active', className: 'Lớp A2', parentPhone: '0943234568' },
  { name: 'Đàm Thị Sương', phone: '0944234567', status: 'Active', className: 'Lớp B1', parentPhone: '0944234568' },
  { name: 'Kha Văn Tân', phone: '0945234567', status: 'Active', className: 'Lớp B1', parentPhone: '0945234568' },
  { name: 'Nghiêm Thị Út', phone: '0946234567', status: 'Active', className: 'Lớp B2', parentPhone: '0946234568' },
  { name: 'Biện Văn Vũ', phone: '0947234567', status: 'Active', className: 'Lớp B2', parentPhone: '0947234568' },
  { name: 'Sử Thị Xuyến', phone: '0948234567', status: 'Active', className: 'Lớp C1', parentPhone: '0948234568' },
  { name: 'Âu Văn Yên', phone: '0949234567', status: 'Active', className: 'Lớp C1', parentPhone: '0949234568' },
  { name: 'Khổng Thị Ánh', phone: '0950234567', status: 'Active', className: 'Lớp C2', parentPhone: '0950234568' },
  { name: 'Hà Văn Bảo', phone: '0951234567', status: 'Active', className: 'Lớp C2', parentPhone: '0951234568' },
  { name: 'Mã Thị Chi', phone: '0952234567', status: 'Active', className: 'Lớp D1', parentPhone: '0952234568' },
  { name: 'Bành Văn Duy', phone: '0953234567', status: 'Active', className: 'Lớp D1', parentPhone: '0953234568' },
  { name: 'Ninh Thị Em', phone: '0954234567', status: 'Active', className: 'Lớp D2', parentPhone: '0954234568' },
  { name: 'Cầm Văn Phúc', phone: '0955234567', status: 'Active', className: 'Lớp D2', parentPhone: '0955234568' },
  { name: 'Triệu Thị Gấm', phone: '0956234567', status: 'Active', className: 'Lớp E1', parentPhone: '0956234568' },
  { name: 'Ông Văn Hào', phone: '0957234567', status: 'Active', className: 'Lớp E1', parentPhone: '0957234568' },
  { name: 'Tống Thị Ivy', phone: '0958234567', status: 'Active', className: 'Lớp E2', parentPhone: '0958234568' },
  { name: 'Lục Văn Jack', phone: '0959234567', status: 'Active', className: 'Lớp E2', parentPhone: '0959234568' },
];

// Test Financial Data
const testFinancialData = [
  // Học phí - chiếm ~70%
  { category: 'Học phí', amount: 45000000, description: 'Học phí lớp A1 - tháng 12', studentName: 'Nhiều học viên' },
  { category: 'Học phí', amount: 38000000, description: 'Học phí lớp A2 - tháng 12', studentName: 'Nhiều học viên' },
  { category: 'Học phí', amount: 52000000, description: 'Học phí lớp B1 - tháng 12', studentName: 'Nhiều học viên' },
  { category: 'Học phí', amount: 28000000, description: 'Học phí lớp B2 - tháng 12', studentName: 'Nhiều học viên' },
  { category: 'Học phí', amount: 35000000, description: 'Học phí lớp C1 - tháng 12', studentName: 'Nhiều học viên' },
  
  // Sách vở - chiếm ~15%
  { category: 'Sách vở', amount: 12500000, description: 'Bán sách Academy Starter 1', studentName: 'Nhiều học viên' },
  { category: 'Sách vở', amount: 8700000, description: 'Bán sách Academy Starter 2', studentName: 'Nhiều học viên' },
  { category: 'Sách vở', amount: 15300000, description: 'Bán sách giáo trình mới', studentName: 'Nhiều học viên' },
  
  // Đồng phục - chiếm ~8%
  { category: 'Đồng phục', amount: 8500000, description: 'Bán đồng phục học viên mới', studentName: '25 học viên' },
  { category: 'Đồng phục', amount: 6200000, description: 'Bán đồng phục bổ sung', studentName: '18 học viên' },
  { category: 'Đồng phục', amount: 4800000, description: 'Đồng phục size đặc biệt', studentName: '12 học viên' },
  
  // Khác - chiếm ~7%
  { category: 'Khác', amount: 5500000, description: 'Phí thi chứng chỉ Cambridge', studentName: '11 học viên' },
  { category: 'Khác', amount: 3800000, description: 'Phí hoạt động ngoại khóa', studentName: 'Lớp A1, A2' },
  { category: 'Khác', amount: 2500000, description: 'Phí tài liệu bổ sung', studentName: 'Nhiều học viên' },
  { category: 'Khác', amount: 4200000, description: 'Phí ôn thi cuối kỳ', studentName: '14 học viên' },
];

// Test Classes Data
const testClasses = [
  { name: 'Lớp A1', level: 'Beginner', schedule: 'T2-T4-T6 18:00', teacher: 'Cô Lan', maxStudents: 15 },
  { name: 'Lớp A2', level: 'Beginner', schedule: 'T3-T5-T7 18:00', teacher: 'Cô Hương', maxStudents: 15 },
  { name: 'Lớp B1', level: 'Elementary', schedule: 'T2-T4-T6 19:30', teacher: 'Thầy Minh', maxStudents: 12 },
  { name: 'Lớp B2', level: 'Elementary', schedule: 'T3-T5-T7 19:30', teacher: 'Cô Mai', maxStudents: 12 },
  { name: 'Lớp C1', level: 'Intermediate', schedule: 'T2-T4-T6 17:00', teacher: 'Thầy John', maxStudents: 10 },
  { name: 'Lớp C2', level: 'Intermediate', schedule: 'T3-T5-T7 17:00', teacher: 'Cô Sarah', maxStudents: 10 },
  { name: 'Lớp D1', level: 'Upper-Intermediate', schedule: 'CN 9:00', teacher: 'Thầy David', maxStudents: 8 },
  { name: 'Lớp D2', level: 'Upper-Intermediate', schedule: 'CN 14:00', teacher: 'Cô Emily', maxStudents: 8 },
  { name: 'Lớp E1', level: 'Advanced', schedule: 'T7 9:00', teacher: 'Thầy Michael', maxStudents: 6 },
  { name: 'Lớp E2', level: 'Advanced', schedule: 'T7 14:00', teacher: 'Cô Jennifer', maxStudents: 6 },
];

// Seed all data
export const seedDashboardData = async () => {
  const currentMonth = getCurrentMonth();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000); // 25 days ago for "new" students
  const oldDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago for regular students
  
  console.log('Starting to seed dashboard data...');
  
  // Seed Classes
  console.log('Seeding classes...');
  const existingClasses = await getDocs(collection(db, CLASSES_COLLECTION));
  if (existingClasses.empty) {
    for (const cls of testClasses) {
      await addDoc(collection(db, CLASSES_COLLECTION), {
        ...cls,
        status: 'Active',
        createdAt: oldDate.toISOString(),
      });
    }
    console.log(`Added ${testClasses.length} classes`);
  } else {
    console.log('Classes already exist, skipping...');
  }
  
  // Seed Students
  console.log('Seeding students...');
  const existingStudents = await getDocs(collection(db, STUDENTS_COLLECTION));
  if (existingStudents.size < 10) {
    for (const student of testStudents) {
      const { isNew, ...studentData } = student;
      await addDoc(collection(db, STUDENTS_COLLECTION), {
        ...studentData,
        createdAt: isNew ? thirtyDaysAgo.toISOString() : oldDate.toISOString(),
        email: `${student.name.toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@email.com`,
      });
    }
    console.log(`Added ${testStudents.length} students`);
  } else {
    console.log('Students already exist, skipping...');
  }
  
  // Seed Financial Data
  console.log('Seeding financial transactions...');
  const existingFinancial = await getDocs(collection(db, FINANCIAL_COLLECTION));
  const monthlyFinancial = existingFinancial.docs.filter(d => d.data().month === currentMonth);
  if (monthlyFinancial.length < 5) {
    let dayCounter = 1;
    for (const transaction of testFinancialData) {
      await addDoc(collection(db, FINANCIAL_COLLECTION), {
        ...transaction,
        type: 'income',
        date: getDateInMonth(dayCounter),
        month: currentMonth,
        createdAt: new Date().toISOString(),
      });
      dayCounter = (dayCounter % 28) + 1;
    }
    console.log(`Added ${testFinancialData.length} financial transactions`);
  } else {
    console.log('Financial data already exists for this month, skipping...');
  }
  
  console.log('Seed completed!');
  console.log('\nSummary:');
  console.log(`- Nợ phí: 12 học viên`);
  console.log(`- Học thử: 8 học viên`);
  console.log(`- Bảo lưu: 5 học viên`);
  console.log(`- Nghỉ học: 4 học viên`);
  console.log(`- HV mới (30 ngày): 10 học viên`);
  console.log(`- HV Active khác: 20 học viên`);
  console.log(`- Tổng: ${testStudents.length} học viên`);
  console.log(`\nDoanh thu tháng ${currentMonth}:`);
  console.log(`- Học phí: ${(198000000).toLocaleString('vi-VN')} đ`);
  console.log(`- Sách vở: ${(36500000).toLocaleString('vi-VN')} đ`);
  console.log(`- Đồng phục: ${(19500000).toLocaleString('vi-VN')} đ`);
  console.log(`- Khác: ${(16000000).toLocaleString('vi-VN')} đ`);
  
  return {
    students: testStudents.length,
    classes: testClasses.length,
    transactions: testFinancialData.length,
  };
};

// Clear all test data (use with caution!)
export const clearDashboardData = async () => {
  console.log('Clearing all dashboard data...');
  
  const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
  for (const d of studentsSnap.docs) {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, d.id));
  }
  console.log(`Deleted ${studentsSnap.size} students`);
  
  const financialSnap = await getDocs(collection(db, FINANCIAL_COLLECTION));
  for (const d of financialSnap.docs) {
    await deleteDoc(doc(db, FINANCIAL_COLLECTION, d.id));
  }
  console.log(`Deleted ${financialSnap.size} financial transactions`);
  
  const classesSnap = await getDocs(collection(db, CLASSES_COLLECTION));
  for (const d of classesSnap.docs) {
    await deleteDoc(doc(db, CLASSES_COLLECTION, d.id));
  }
  console.log(`Deleted ${classesSnap.size} classes`);
  
  console.log('Clear completed!');
};

export default seedDashboardData;
