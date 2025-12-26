/**
 * Student Auth Service
 * Xác thực học viên bằng mã học viên + mật khẩu
 */

import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface StudentSession {
    studentId: string;
    studentCode: string;
    studentName: string;
    classId?: string;
    className?: string;
    loginAt: string;
}

const SESSION_KEY = 'studentSession';
const DEFAULT_PASSWORD = '123456';

export class StudentAuthService {
    /**
     * Đăng nhập học viên bằng mã học viên + password
     */
    static async login(studentCode: string, password: string): Promise<StudentSession> {
        // Tìm học viên theo mã
        const q = query(
            collection(db, 'students'),
            where('code', '==', studentCode.toUpperCase())
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error('Mã học viên không tồn tại');
        }

        const studentDoc = snapshot.docs[0];
        const studentData = studentDoc.data();

        // Kiểm tra password (mặc định là 123456 nếu chưa đổi)
        const storedPassword = studentData.password || DEFAULT_PASSWORD;
        if (password !== storedPassword) {
            throw new Error('Mật khẩu không đúng');
        }

        // Tạo session
        const session: StudentSession = {
            studentId: studentDoc.id,
            studentCode: studentData.code,
            studentName: studentData.fullName || studentData.name || 'Học viên',
            classId: studentData.classId,
            className: studentData.class || studentData.className,
            loginAt: new Date().toISOString()
        };

        // Lưu session vào localStorage
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        return session;
    }

    /**
     * Đăng xuất
     */
    static logout(): void {
        localStorage.removeItem(SESSION_KEY);
    }

    /**
     * Lấy session hiện tại
     */
    static getSession(): StudentSession | null {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return null;

        try {
            return JSON.parse(sessionStr) as StudentSession;
        } catch {
            return null;
        }
    }

    /**
     * Kiểm tra đã đăng nhập chưa
     */
    static isLoggedIn(): boolean {
        return this.getSession() !== null;
    }

    /**
     * Đổi mật khẩu
     */
    static async changePassword(studentId: string, oldPassword: string, newPassword: string): Promise<void> {
        // Lấy thông tin học viên
        const q = query(
            collection(db, 'students'),
            where('__name__', '==', studentId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error('Học viên không tồn tại');
        }

        const studentDoc = snapshot.docs[0];
        const studentData = studentDoc.data();
        const storedPassword = studentData.password || DEFAULT_PASSWORD;

        if (oldPassword !== storedPassword) {
            throw new Error('Mật khẩu cũ không đúng');
        }

        // Cập nhật mật khẩu mới
        await updateDoc(doc(db, 'students', studentId), {
            password: newPassword
        });
    }
}
