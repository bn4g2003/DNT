/**
 * Notification Service
 * Tự động tạo thông báo cho học viên dựa trên các sự kiện trong hệ thống
 * KHÔNG phải là form nhập liệu - tự động trigger từ các action
 */

import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export type NotificationType = 
  | 'payment_due'      // Thông báo đóng học phí
  | 'feedback_request' // Yêu cầu điền feedback
  | 'homework'         // Bài tập mới
  | 'schedule_change'  // Thay đổi lịch học
  | 'general';         // Thông báo chung

export interface StudentNotification {
  id?: string;
  studentId: string;
  studentName: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;        // Link đến trang liên quan
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;   // Thông báo hết hạn
}

const NOTIFICATIONS_COLLECTION = 'studentNotifications';

/**
 * Tạo thông báo đóng học phí - TỰ ĐỘNG từ contract/debt
 */
export const createPaymentNotification = async (
  studentId: string,
  studentName: string,
  amount: number,
  dueDate: string
): Promise<void> => {
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      studentId,
      studentName,
      type: 'payment_due',
      title: '💰 Thông báo đóng học phí',
      message: `Bạn cần đóng học phí ${amount.toLocaleString('vi-VN')}đ trước ngày ${dueDate}`,
      link: '/student/payments',
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: dueDate,
    });
  } catch (error) {
    console.error('Error creating payment notification:', error);
  }
};

/**
 * Tạo thông báo feedback - TỰ ĐỘNG từ feedback campaign
 */
export const createFeedbackNotification = async (
  studentId: string,
  studentName: string,
  className: string,
  feedbackLink: string
): Promise<void> => {
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      studentId,
      studentName,
      type: 'feedback_request',
      title: '📝 Yêu cầu đánh giá',
      message: `Vui lòng đánh giá chất lượng học tập tại lớp ${className}`,
      link: feedbackLink,
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 ngày
    });
  } catch (error) {
    console.error('Error creating feedback notification:', error);
  }
};

/**
 * Tạo thông báo bài tập - TỰ ĐỘNG từ homework manager
 */
export const createHomeworkNotification = async (
  studentId: string,
  studentName: string,
  homeworkTitle: string,
  dueDate: string
): Promise<void> => {
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      studentId,
      studentName,
      type: 'homework',
      title: '📚 Bài tập mới',
      message: `Bài tập "${homeworkTitle}" cần hoàn thành trước ${dueDate}`,
      link: '/student/homework',
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: dueDate,
    });
  } catch (error) {
    console.error('Error creating homework notification:', error);
  }
};

/**
 * Tạo thông báo thay đổi lịch - TỰ ĐỘNG từ schedule/holiday
 */
export const createScheduleChangeNotification = async (
  studentIds: string[],
  className: string,
  changeDescription: string
): Promise<void> => {
  try {
    const promises = studentIds.map(studentId =>
      addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        studentId,
        type: 'schedule_change',
        title: '📅 Thay đổi lịch học',
        message: `Lớp ${className}: ${changeDescription}`,
        link: '/student/schedule',
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error creating schedule change notifications:', error);
  }
};

/**
 * Lấy thông báo của học viên
 */
export const getStudentNotifications = async (
  studentId: string,
  unreadOnly: boolean = false
): Promise<StudentNotification[]> => {
  try {
    let q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (unreadOnly) {
      q = query(q, where('isRead', '==', false));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StudentNotification));
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

/**
 * Đánh dấu đã đọc
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { doc: docRef, updateDoc } = await import('firebase/firestore');
    await updateDoc(docRef(db, NOTIFICATIONS_COLLECTION, notificationId), {
      isRead: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};
