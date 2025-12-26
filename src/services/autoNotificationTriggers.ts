/**
 * Auto Notification Triggers
 * Tự động trigger thông báo dựa trên các sự kiện trong hệ thống
 * KHÔNG cần sửa code hiện tại - chỉ cần import và init
 */

import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  createPaymentNotification,
  createFeedbackNotification,
  createHomeworkNotification,
  createScheduleChangeNotification
} from './notificationService';

/**
 * Lắng nghe contract mới có nợ -> gửi thông báo đóng phí
 */
export const watchContractDebts = () => {
  const q = query(
    collection(db, 'contracts'),
    where('status', 'in', ['Chờ thanh toán', 'Nợ hợp đồng'])
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified') {
        const contract = change.doc.data();
        
        // Nếu có nợ và có ngày hẹn thanh toán
        if (contract.remainingAmount > 0 && contract.nextPaymentDate && contract.studentId) {
          createPaymentNotification(
            contract.studentId,
            contract.studentName || 'Học viên',
            contract.remainingAmount,
            contract.nextPaymentDate
          );
        }
      }
    });
  });
};

/**
 * Lắng nghe feedback campaign -> gửi thông báo điền form
 */
export const watchFeedbackCampaigns = () => {
  const q = query(
    collection(db, 'feedbackCampaigns'),
    where('status', '==', 'active')
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const campaign = change.doc.data();
        
        // Gửi thông báo cho từng học viên trong campaign
        if (campaign.targetStudents && Array.isArray(campaign.targetStudents)) {
          campaign.targetStudents.forEach((student: any) => {
            if (student.id && student.name && student.className) {
              const feedbackLink = `/feedback-form/${change.doc.id}?student=${student.id}`;
              createFeedbackNotification(
                student.id,
                student.name,
                student.className,
                feedbackLink
              );
            }
          });
        }
      }
    });
  });
};

/**
 * Lắng nghe homework mới -> gửi thông báo
 */
export const watchHomework = () => {
  const q = collection(db, 'homework');

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const homework = change.doc.data();
        
        // Lấy danh sách học viên trong lớp và gửi thông báo
        if (homework.classId && homework.title && homework.dueDate) {
          // Query students in class
          const studentsQuery = query(
            collection(db, 'students'),
            where('classId', '==', homework.classId)
          );
          
          onSnapshot(studentsQuery, (studentsSnapshot) => {
            studentsSnapshot.docs.forEach((studentDoc) => {
              const student = studentDoc.data();
              if (student.id && student.fullName) {
                createHomeworkNotification(
                  student.id,
                  student.fullName,
                  homework.title,
                  homework.dueDate
                );
              }
            });
          });
        }
      }
    });
  });
};

/**
 * Lắng nghe thay đổi lịch học -> gửi thông báo
 */
export const watchScheduleChanges = () => {
  const q = collection(db, 'classes');

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const oldData = change.doc.data();
        const newData = change.doc.data();
        
        // Kiểm tra nếu có thay đổi lịch học
        const scheduleChanged = 
          oldData.schedule !== newData.schedule ||
          oldData.room !== newData.room ||
          JSON.stringify(oldData.scheduleDetails) !== JSON.stringify(newData.scheduleDetails);
        
        if (scheduleChanged && newData.id && newData.name) {
          // Lấy danh sách học viên và gửi thông báo
          const studentsQuery = query(
            collection(db, 'students'),
            where('classId', '==', newData.id)
          );
          
          onSnapshot(studentsQuery, (studentsSnapshot) => {
            const studentIds = studentsSnapshot.docs.map(doc => doc.data().id).filter(Boolean);
            
            if (studentIds.length > 0) {
              const changeDesc = `Lịch học đã được cập nhật. Vui lòng kiểm tra lại thời khóa biểu.`;
              createScheduleChangeNotification(studentIds, newData.name, changeDesc);
            }
          });
        }
      }
    });
  });
};

/**
 * Lắng nghe holiday -> gửi thông báo nghỉ lễ
 */
export const watchHolidays = () => {
  const q = query(
    collection(db, 'holidays'),
    where('status', '==', 'Đã áp dụng')
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const holiday = change.doc.data();
        
        if (holiday.classIds && Array.isArray(holiday.classIds)) {
          // Gửi thông báo cho học viên các lớp bị ảnh hưởng
          holiday.classIds.forEach((classId: string) => {
            const studentsQuery = query(
              collection(db, 'students'),
              where('classId', '==', classId)
            );
            
            onSnapshot(studentsQuery, (studentsSnapshot) => {
              const studentIds = studentsSnapshot.docs.map(doc => doc.data().id).filter(Boolean);
              
              if (studentIds.length > 0) {
                const changeDesc = `Nghỉ lễ ${holiday.name} từ ${holiday.startDate} đến ${holiday.endDate}`;
                createScheduleChangeNotification(studentIds, holiday.classNames?.[0] || 'Lớp học', changeDesc);
              }
            });
          });
        }
      }
    });
  });
};

/**
 * Khởi tạo tất cả listeners - GỌI 1 LẦN khi app start
 */
export const initAutoNotifications = () => {
  const unsubscribers = [
    watchContractDebts(),
    watchFeedbackCampaigns(),
    watchHomework(),
    watchScheduleChanges(),
    watchHolidays(),
  ];

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};
