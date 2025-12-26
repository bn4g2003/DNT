import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyCgjkomzDSqFfVnNJkEfWsbR2PE0cVJp0M',
  projectId: 'edumanager-pro-6180f',
});
const db = getFirestore(app);

async function seed() {
  const sessions = [
    { staffName: 'Nguyễn Thị A', position: 'Giáo viên Việt', date: '2024-12-05', timeStart: '17:30', timeEnd: '19:00', className: 'Movers 1A', type: 'Dạy chính', status: 'Chờ xác nhận' },
    { staffName: 'Trần Văn B', position: 'Giáo viên Việt', date: '2024-12-05', timeStart: '19:30', timeEnd: '21:00', className: 'Flyers 3A', type: 'Dạy chính', status: 'Chờ xác nhận' },
    { staffName: 'Lê Thị C', position: 'Trợ giảng', date: '2024-12-05', timeStart: '17:30', timeEnd: '19:00', className: 'Movers 1A', type: 'Trợ giảng', status: 'Chờ xác nhận' },
  ];
  
  for (const s of sessions) {
    await addDoc(collection(db, 'workSessions'), s);
    console.log('Added pending:', s.staffName, s.date);
  }
  console.log('Done!');
  process.exit(0);
}
seed();
