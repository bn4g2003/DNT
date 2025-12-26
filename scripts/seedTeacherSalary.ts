import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCgjkomzDSqFfVnNJkEfWsbR2PE0cVJp0M",
  authDomain: "edumanager-pro-6180f.firebaseapp.com",
  projectId: "edumanager-pro-6180f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const sessions = [
    // GV Việt 1
    { staffName: 'Nguyễn Thị A', position: 'Giáo viên Việt', date: '2024-12-01', timeStart: '17:30', timeEnd: '19:00', className: 'Movers 1A', type: 'Dạy chính', status: 'Đã xác nhận', studentCount: 9 },
    { staffName: 'Nguyễn Thị A', position: 'Giáo viên Việt', date: '2024-12-02', timeStart: '17:30', timeEnd: '19:00', className: 'Movers 1A', type: 'Dạy chính', status: 'Đã xác nhận', studentCount: 8 },
    { staffName: 'Nguyễn Thị A', position: 'Giáo viên Việt', date: '2024-12-03', timeStart: '19:30', timeEnd: '21:00', className: 'Starters 2B', type: 'Dạy chính', status: 'Đã xác nhận', studentCount: 12 },
    { staffName: 'Nguyễn Thị A', position: 'Giáo viên Việt', date: '2024-12-04', timeStart: '17:30', timeEnd: '19:00', className: 'Movers 1A', type: 'Dạy chính', status: 'Chờ xác nhận', studentCount: 10 },
    // GV Việt 2
    { staffName: 'Trần Văn B', position: 'Giáo viên Việt', date: '2024-12-01', timeStart: '19:30', timeEnd: '21:00', className: 'Flyers 3A', type: 'Dạy chính', status: 'Đã xác nhận', studentCount: 11 },
    { staffName: 'Trần Văn B', position: 'Giáo viên Việt', date: '2024-12-02', timeStart: '19:30', timeEnd: '21:00', className: 'Flyers 3A', type: 'Dạy chính', status: 'Đã xác nhận', studentCount: 10 },
    { staffName: 'Trần Văn B', position: 'Giáo viên Việt', date: '2024-12-03', timeStart: '17:30', timeEnd: '19:00', className: 'Movers 2C', type: 'Dạy chính', status: 'Đã xác nhận', studentCount: 8 },
    // GV Nước ngoài
    { staffName: 'Alex', position: 'Giáo viên Nước Ngoài', date: '2024-12-01', timeStart: '18:00', timeEnd: '19:00', className: 'Movers 1A', type: 'Dạy chính', status: 'Đã xác nhận' },
    { staffName: 'Alex', position: 'Giáo viên Nước Ngoài', date: '2024-12-02', timeStart: '18:00', timeEnd: '19:00', className: 'Flyers 3A', type: 'Dạy chính', status: 'Đã xác nhận' },
    { staffName: 'Alex', position: 'Giáo viên Nước Ngoài', date: '2024-12-03', timeStart: '18:00', timeEnd: '19:00', className: 'Starters 2B', type: 'Dạy chính', status: 'Đã xác nhận' },
    // Trợ giảng
    { staffName: 'Lê Thị C', position: 'Trợ giảng', date: '2024-12-01', timeStart: '17:30', timeEnd: '19:00', className: 'Movers 1A', type: 'Trợ giảng', status: 'Đã xác nhận' },
    { staffName: 'Lê Thị C', position: 'Trợ giảng', date: '2024-12-02', timeStart: '17:30', timeEnd: '19:00', className: 'Movers 1A', type: 'Trợ giảng', status: 'Đã xác nhận' },
    { staffName: 'Lê Thị C', position: 'Trợ giảng', date: '2024-12-01', timeStart: '19:30', timeEnd: '21:00', className: 'Flyers 3A', type: 'Nhận xét', status: 'Đã xác nhận' },
  ];

  for (const s of sessions) {
    await addDoc(collection(db, 'workSessions'), s);
    console.log('Added:', s.staffName, s.date, s.className);
  }

  console.log('Done!');
  process.exit(0);
}

seed();
