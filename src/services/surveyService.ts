/**
 * Survey Service
 * Quản lý form khảo sát templates và assignments
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  SurveyTemplate,
  SurveyAssignment,
  SurveyResponse,
  DEFAULT_SURVEY_TEMPLATES
} from '../types/surveyTypes';

const TEMPLATES_COLLECTION = 'surveyTemplates';
const ASSIGNMENTS_COLLECTION = 'surveyAssignments';
const RESPONSES_COLLECTION = 'surveyResponses';

// Generate random token
const generateToken = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

export class SurveyService {
  // ========================================
  // TEMPLATES - Form mẫu có sẵn
  // ========================================

  static async getTemplates(): Promise<SurveyTemplate[]> {
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SurveyTemplate[];
  }

  static async getTemplate(id: string): Promise<SurveyTemplate | null> {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as SurveyTemplate;
  }

  static async createTemplate(data: Omit<SurveyTemplate, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...data,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  }

  static async updateTemplate(id: string, data: Partial<SurveyTemplate>): Promise<void> {
    const docRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteTemplate(id: string): Promise<void> {
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));
  }

  static onTemplatesChange(callback: (templates: SurveyTemplate[]) => void): Unsubscribe {
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SurveyTemplate[];
      callback(templates);
    });
  }

  // Initialize default templates if none exist
  static async initializeDefaultTemplates(): Promise<void> {
    const existing = await this.getTemplates();
    if (existing.length === 0) {
      for (const template of DEFAULT_SURVEY_TEMPLATES) {
        await this.createTemplate(template);
      }
    }
  }


  // ========================================
  // ASSIGNMENTS - Gán form cho học viên
  // ========================================

  static async assignSurvey(
    templateId: string,
    students: Array<{ id: string; name: string; code?: string; classId?: string; className?: string }>,
    assignedBy?: string,
    expiresAt?: string
  ): Promise<SurveyAssignment[]> {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const assignments: SurveyAssignment[] = [];

    for (const student of students) {
      // Check if already assigned and pending
      const existingQuery = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('templateId', '==', templateId),
        where('studentId', '==', student.id),
        where('status', '==', 'pending')
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (existingSnapshot.empty) {
        const token = generateToken();
        const docRef = await addDoc(collection(db, ASSIGNMENTS_COLLECTION), {
          templateId,
          templateName: template.name,
          studentId: student.id,
          studentName: student.name,
          studentCode: student.code || null,
          classId: student.classId || null,
          className: student.className || null,
          status: 'pending',
          token,
          assignedAt: new Date().toISOString(),
          assignedBy: assignedBy || null,
          expiresAt: expiresAt || null
        });

        assignments.push({
          id: docRef.id,
          templateId,
          templateName: template.name,
          studentId: student.id,
          studentName: student.name,
          studentCode: student.code,
          classId: student.classId,
          className: student.className,
          status: 'pending',
          token,
          assignedAt: new Date().toISOString(),
          assignedBy,
          expiresAt
        });
      }
    }

    return assignments;
  }

  static async getAssignments(filters?: {
    templateId?: string;
    studentId?: string;
    status?: 'pending' | 'submitted' | 'expired';
  }): Promise<SurveyAssignment[]> {
    let q = query(collection(db, ASSIGNMENTS_COLLECTION), orderBy('assignedAt', 'desc'));

    const snapshot = await getDocs(q);
    let assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SurveyAssignment[];

    // Filter in memory (Firestore doesn't support multiple where with orderBy easily)
    if (filters?.templateId) {
      assignments = assignments.filter(a => a.templateId === filters.templateId);
    }
    if (filters?.studentId) {
      assignments = assignments.filter(a => a.studentId === filters.studentId);
    }
    if (filters?.status) {
      assignments = assignments.filter(a => a.status === filters.status);
    }

    return assignments;
  }

  static async getAssignmentByToken(token: string): Promise<SurveyAssignment | null> {
    const q = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where('token', '==', token)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as SurveyAssignment;
  }

  static async getStudentPendingSurveys(studentId: string): Promise<SurveyAssignment[]> {
    // Query all assignments and filter in memory
    const q = query(collection(db, ASSIGNMENTS_COLLECTION));
    const snapshot = await getDocs(q);
    const allAssignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SurveyAssignment);
    
    // Debug: log all assignments to see what studentIds exist
    console.log('All assignments in DB:', allAssignments.map(a => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.studentName,
      status: a.status
    })));
    console.log('Looking for studentId:', studentId);
    
    return allAssignments.filter(a => a.studentId === studentId && a.status === 'pending');
  }

  static async cancelAssignment(assignmentId: string): Promise<void> {
    await deleteDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId));
  }

  static onAssignmentsChange(
    callback: (assignments: SurveyAssignment[]) => void,
    studentId?: string
  ): Unsubscribe {
    let q;
    if (studentId) {
      q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('studentId', '==', studentId),
        orderBy('assignedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        orderBy('assignedAt', 'desc')
      );
    }
    return onSnapshot(q, (snapshot) => {
      const assignments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SurveyAssignment[];
      callback(assignments);
    });
  }


  // ========================================
  // RESPONSES - Câu trả lời từ học viên
  // ========================================

  static async submitResponse(data: Omit<SurveyResponse, 'id'>): Promise<string> {
    // Calculate average score from category scores
    const scores = [
      data.teacherScore,
      data.curriculumScore,
      data.careScore,
      data.facilitiesScore
    ].filter((s): s is number => s !== undefined && s !== null && s > 0);

    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;

    // Build response object, excluding undefined values
    const responseData: Record<string, any> = {
      assignmentId: data.assignmentId,
      templateId: data.templateId,
      templateName: data.templateName,
      studentId: data.studentId,
      studentName: data.studentName,
      answers: data.answers || {},
      submittedAt: new Date().toISOString(),
      submittedBy: data.submittedBy || 'student',
    };

    // Only add optional fields if they have values
    if (data.studentCode) responseData.studentCode = data.studentCode;
    if (data.classId) responseData.classId = data.classId;
    if (data.className) responseData.className = data.className;
    if (data.teacherScore !== undefined && data.teacherScore !== null) responseData.teacherScore = data.teacherScore;
    if (data.curriculumScore !== undefined && data.curriculumScore !== null) responseData.curriculumScore = data.curriculumScore;
    if (data.careScore !== undefined && data.careScore !== null) responseData.careScore = data.careScore;
    if (data.facilitiesScore !== undefined && data.facilitiesScore !== null) responseData.facilitiesScore = data.facilitiesScore;
    if (averageScore !== null) responseData.averageScore = averageScore;
    if (data.comments) responseData.comments = data.comments;
    if (data.submitterName) responseData.submitterName = data.submitterName;
    if (data.submitterPhone) responseData.submitterPhone = data.submitterPhone;

    const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), responseData);

    // Update assignment status
    if (data.assignmentId) {
      const assignmentRef = doc(db, ASSIGNMENTS_COLLECTION, data.assignmentId);
      await updateDoc(assignmentRef, {
        status: 'submitted',
        submittedAt: new Date().toISOString()
      });
    }

    return docRef.id;
  }

  static async getResponses(filters?: {
    templateId?: string;
    studentId?: string;
    classId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<SurveyResponse[]> {
    const q = query(
      collection(db, RESPONSES_COLLECTION),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    let responses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SurveyResponse[];

    // Filter in memory
    if (filters?.templateId) {
      responses = responses.filter(r => r.templateId === filters.templateId);
    }
    if (filters?.studentId) {
      responses = responses.filter(r => r.studentId === filters.studentId);
    }
    if (filters?.classId) {
      responses = responses.filter(r => r.classId === filters.classId);
    }
    if (filters?.fromDate) {
      responses = responses.filter(r => r.submittedAt >= filters.fromDate!);
    }
    if (filters?.toDate) {
      responses = responses.filter(r => r.submittedAt <= filters.toDate!);
    }

    return responses;
  }

  static onResponsesChange(callback: (responses: SurveyResponse[]) => void): Unsubscribe {
    const q = query(
      collection(db, RESPONSES_COLLECTION),
      orderBy('submittedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const responses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SurveyResponse[];
      callback(responses);
    });
  }

  // ========================================
  // STATISTICS
  // ========================================

  static async getStatistics(filters?: {
    templateId?: string;
    classId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{
    totalAssigned: number;
    totalSubmitted: number;
    responseRate: number;
    averageScores: {
      teacher: number;
      curriculum: number;
      care: number;
      facilities: number;
      overall: number;
    };
  }> {
    const assignments = await this.getAssignments({ templateId: filters?.templateId });
    const responses = await this.getResponses(filters);

    const submitted = assignments.filter(a => a.status === 'submitted').length;
    const responseRate = assignments.length > 0 ? (submitted / assignments.length) * 100 : 0;

    // Calculate average scores
    const teacherScores = responses.map(r => r.teacherScore).filter((s): s is number => s !== undefined);
    const curriculumScores = responses.map(r => r.curriculumScore).filter((s): s is number => s !== undefined);
    const careScores = responses.map(r => r.careScore).filter((s): s is number => s !== undefined);
    const facilitiesScores = responses.map(r => r.facilitiesScore).filter((s): s is number => s !== undefined);
    const overallScores = responses.map(r => r.averageScore).filter((s): s is number => s !== undefined);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      totalAssigned: assignments.length,
      totalSubmitted: submitted,
      responseRate: Math.round(responseRate * 10) / 10,
      averageScores: {
        teacher: Math.round(avg(teacherScores) * 10) / 10,
        curriculum: Math.round(avg(curriculumScores) * 10) / 10,
        care: Math.round(avg(careScores) * 10) / 10,
        facilities: Math.round(avg(facilitiesScores) * 10) / 10,
        overall: Math.round(avg(overallScores) * 10) / 10,
      }
    };
  }
}
