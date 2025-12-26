/**
 * Teacher Report Service
 * Báo cáo chi tiết giáo viên, task, mục tiêu
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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  TeacherDetailReport, 
  TeacherTask, 
  TaskAssignment,
  TeacherGoal, 
  TeacherPerformance,
  TaskStatus 
} from '../../types';

const TEACHER_REPORTS_COLLECTION = 'teacher_reports';
const TEACHER_TASKS_COLLECTION = 'teacher_tasks';
const TASK_ASSIGNMENTS_COLLECTION = 'task_assignments';
const TEACHER_GOALS_COLLECTION = 'teacher_goals';
const TEACHER_PERFORMANCE_COLLECTION = 'teacher_performance';

// ==========================================
// TEACHER DETAIL REPORT
// ==========================================

export const getTeacherReports = async (period?: string): Promise<TeacherDetailReport[]> => {
  try {
    let q;
    if (period) {
      q = query(
        collection(db, TEACHER_REPORTS_COLLECTION),
        where('period', '==', period),
        orderBy('teacherName', 'asc')
      );
    } else {
      q = query(collection(db, TEACHER_REPORTS_COLLECTION), orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherDetailReport[];
  } catch (error) {
    console.error('Error fetching teacher reports:', error);
    throw error;
  }
};

export const createTeacherReport = async (data: Omit<TeacherDetailReport, 'id'>): Promise<string> => {
  try {
    const reportData = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, TEACHER_REPORTS_COLLECTION), reportData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating teacher report:', error);
    throw error;
  }
};

export const updateTeacherReport = async (id: string, data: Partial<TeacherDetailReport>): Promise<void> => {
  try {
    const docRef = doc(db, TEACHER_REPORTS_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error updating teacher report:', error);
    throw error;
  }
};

export const deleteTeacherReport = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, TEACHER_REPORTS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting teacher report:', error);
    throw error;
  }
};


// ==========================================
// TEACHER TASKS
// ==========================================

export const getTeacherTasks = async (status?: TaskStatus): Promise<TeacherTask[]> => {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, TEACHER_TASKS_COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(collection(db, TEACHER_TASKS_COLLECTION), orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherTask[];
  } catch (error) {
    console.error('Error fetching teacher tasks:', error);
    throw error;
  }
};

export const getTasksByStaff = async (staffId: string): Promise<TeacherTask[]> => {
  try {
    const q = query(
      collection(db, TEACHER_TASKS_COLLECTION),
      where('assignedTo', 'array-contains', staffId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherTask[];
  } catch (error) {
    console.error('Error fetching tasks by staff:', error);
    throw error;
  }
};

export const createTeacherTask = async (data: Omit<TeacherTask, 'id'>): Promise<string> => {
  try {
    const taskData = {
      ...data,
      status: data.status || 'pending',
      progress: data.progress || 0,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, TEACHER_TASKS_COLLECTION), taskData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating teacher task:', error);
    throw error;
  }
};

export const updateTeacherTask = async (id: string, data: Partial<TeacherTask>): Promise<void> => {
  try {
    const docRef = doc(db, TEACHER_TASKS_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error updating teacher task:', error);
    throw error;
  }
};

export const deleteTeacherTask = async (id: string): Promise<void> => {
  try {
    // Delete all assignments for this task
    const assignmentsQuery = query(
      collection(db, TASK_ASSIGNMENTS_COLLECTION),
      where('taskId', '==', id)
    );
    const assignmentsSnap = await getDocs(assignmentsQuery);
    for (const doc of assignmentsSnap.docs) {
      await deleteDoc(doc.ref);
    }
    
    await deleteDoc(doc(db, TEACHER_TASKS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting teacher task:', error);
    throw error;
  }
};

// ==========================================
// TASK ASSIGNMENTS
// ==========================================

export const getTaskAssignments = async (taskId: string): Promise<TaskAssignment[]> => {
  try {
    const q = query(
      collection(db, TASK_ASSIGNMENTS_COLLECTION),
      where('taskId', '==', taskId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TaskAssignment[];
  } catch (error) {
    console.error('Error fetching task assignments:', error);
    throw error;
  }
};

export const updateTaskAssignment = async (id: string, data: Partial<TaskAssignment>): Promise<void> => {
  try {
    const docRef = doc(db, TASK_ASSIGNMENTS_COLLECTION, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating task assignment:', error);
    throw error;
  }
};

// ==========================================
// TEACHER GOALS
// ==========================================

export const getTeacherGoals = async (staffId?: string, period?: string): Promise<TeacherGoal[]> => {
  try {
    let q = query(collection(db, TEACHER_GOALS_COLLECTION), orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    let goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherGoal[];
    
    if (staffId) {
      goals = goals.filter(g => g.staffId === staffId);
    }
    if (period) {
      goals = goals.filter(g => g.period === period);
    }
    
    return goals;
  } catch (error) {
    console.error('Error fetching teacher goals:', error);
    throw error;
  }
};

export const createTeacherGoal = async (data: Omit<TeacherGoal, 'id'>): Promise<string> => {
  try {
    const goalData = {
      ...data,
      kpiActual: data.kpiActual || 0,
      kpiResult: data.kpiResult || 0,
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, TEACHER_GOALS_COLLECTION), goalData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating teacher goal:', error);
    throw error;
  }
};

export const updateTeacherGoal = async (id: string, data: Partial<TeacherGoal>): Promise<void> => {
  try {
    const docRef = doc(db, TEACHER_GOALS_COLLECTION, id);
    // Auto calculate kpiResult
    if (data.kpiActual !== undefined && data.kpiTarget !== undefined) {
      data.kpiResult = data.kpiTarget > 0 ? Math.round((data.kpiActual / data.kpiTarget) * 100) : 0;
    }
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error updating teacher goal:', error);
    throw error;
  }
};

export const deleteTeacherGoal = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, TEACHER_GOALS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting teacher goal:', error);
    throw error;
  }
};

// ==========================================
// TEACHER PERFORMANCE (Kết quả tổng hợp)
// ==========================================

export const getTeacherPerformance = async (period?: string): Promise<TeacherPerformance[]> => {
  try {
    let q;
    if (period) {
      q = query(
        collection(db, TEACHER_PERFORMANCE_COLLECTION),
        where('period', '==', period),
        orderBy('staffName', 'asc')
      );
    } else {
      q = query(collection(db, TEACHER_PERFORMANCE_COLLECTION), orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherPerformance[];
  } catch (error) {
    console.error('Error fetching teacher performance:', error);
    throw error;
  }
};

export const calculateTeacherPerformance = async (
  staffId: string, 
  staffName: string, 
  staffRole: 'Giáo viên' | 'Trợ giảng',
  period: string
): Promise<TeacherPerformance> => {
  try {
    // Get all tasks for this staff in period
    const tasks = await getTasksByStaff(staffId);
    const periodTasks = tasks.filter(t => t.createdAt?.startsWith(period.substring(0, 7)));
    
    // Calculate task result (average progress of completed tasks)
    const completedTasks = periodTasks.filter(t => t.status === 'completed');
    const taskResult = completedTasks.length > 0 
      ? Math.round(completedTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / completedTasks.length)
      : 0;
    
    // Get goals for this staff in period
    const goals = await getTeacherGoals(staffId, period);
    
    // Calculate goal result (weighted average)
    let goalResult = 0;
    if (goals.length > 0) {
      const totalWeight = goals.reduce((sum, g) => sum + (g.kpiWeight || 0), 0);
      if (totalWeight > 0) {
        goalResult = Math.round(
          goals.reduce((sum, g) => sum + (g.kpiResult || 0) * (g.kpiWeight || 0), 0) / totalWeight
        );
      }
    }
    
    // Final result = (task + goal) / 2
    const finalResult = Math.round((taskResult + goalResult) / 2);
    
    return {
      id: '',
      staffId,
      staffName,
      staffRole,
      period,
      taskResult,
      goalResult,
      finalResult,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error calculating teacher performance:', error);
    throw error;
  }
};

export const saveTeacherPerformance = async (data: Omit<TeacherPerformance, 'id'>): Promise<string> => {
  try {
    // Check if exists for this staff and period
    const existing = await getTeacherPerformance(data.period);
    const found = existing.find(p => p.staffId === data.staffId);
    
    if (found) {
      await updateDoc(doc(db, TEACHER_PERFORMANCE_COLLECTION, found.id), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return found.id;
    } else {
      const docRef = await addDoc(collection(db, TEACHER_PERFORMANCE_COLLECTION), {
        ...data,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving teacher performance:', error);
    throw error;
  }
};
