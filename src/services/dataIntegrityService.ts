/**
 * Data Integrity Service
 * Handles cascading updates, validation, and consistency checks
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// 1. CASCADING OPERATIONS
// ============================================

/**
 * Cascade update when a class is deleted
 * - Updates all students with this classId to null
 * - Updates all work sessions references
 */
export const cascadeDeleteClass = async (classId: string, className?: string): Promise<{
  studentsUpdated: number;
  workSessionsUpdated: number;
  attendanceDeleted: number;
}> => {
  const batch = writeBatch(db);
  let studentsUpdated = 0;
  let workSessionsUpdated = 0;
  let attendanceDeleted = 0;

  // Update students
  const studentsQuery = query(
    collection(db, 'students'),
    where('classId', '==', classId)
  );
  const studentsSnap = await getDocs(studentsQuery);
  studentsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      classId: null,
      className: null,
      class: null,
    });
    studentsUpdated++;
  });

  // Also check students by className (legacy field)
  if (className) {
    const studentsByNameQuery = query(
      collection(db, 'students'),
      where('class', '==', className)
    );
    const studentsByNameSnap = await getDocs(studentsByNameQuery);
    studentsByNameSnap.forEach((docSnap) => {
      if (!studentsSnap.docs.find(d => d.id === docSnap.id)) {
        batch.update(docSnap.ref, {
          classId: null,
          className: null,
          class: null,
        });
        studentsUpdated++;
      }
    });
  }

  // Update work sessions
  const workSessionsQuery = query(
    collection(db, 'workSessions'),
    where('classId', '==', classId)
  );
  const workSessionsSnap = await getDocs(workSessionsQuery);
  workSessionsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      classId: null,
      className: '[Lớp đã xóa]',
    });
    workSessionsUpdated++;
  });

  // Delete attendance records for this class
  const attendanceQuery = query(
    collection(db, 'attendance'),
    where('classId', '==', classId)
  );
  const attendanceSnap = await getDocs(attendanceQuery);
  for (const docSnap of attendanceSnap.docs) {
    // Delete student attendance records first
    const studentAttendanceQuery = query(
      collection(db, 'studentAttendance'),
      where('attendanceId', '==', docSnap.id)
    );
    const studentAttendanceSnap = await getDocs(studentAttendanceQuery);
    studentAttendanceSnap.forEach((saDoc) => {
      batch.delete(saDoc.ref);
    });
    // Delete main attendance record
    batch.delete(docSnap.ref);
    attendanceDeleted++;
  }

  await batch.commit();

  return { studentsUpdated, workSessionsUpdated, attendanceDeleted };
};

/**
 * Cascade update when a parent is updated
 * - Syncs parentName and parentPhone to all children (students)
 */
export const cascadeUpdateParent = async (
  parentId: string,
  updates: { name?: string; phone?: string }
): Promise<number> => {
  const batch = writeBatch(db);
  let studentsUpdated = 0;

  const studentsQuery = query(
    collection(db, 'students'),
    where('parentId', '==', parentId)
  );
  const studentsSnap = await getDocs(studentsQuery);

  studentsSnap.forEach((docSnap) => {
    const updateData: any = {};
    if (updates.name) updateData.parentName = updates.name;
    if (updates.phone) updateData.parentPhone = updates.phone;

    if (Object.keys(updateData).length > 0) {
      batch.update(docSnap.ref, updateData);
      studentsUpdated++;
    }
  });

  if (studentsUpdated > 0) {
    await batch.commit();
  }

  return studentsUpdated;
};

/**
 * Cascade update when a staff (teacher) is deleted
 * - Updates all classes with this teacherId
 */
export const cascadeDeleteStaff = async (staffId: string): Promise<{
  classesUpdated: number;
  workSessionsUpdated: number;
}> => {
  const batch = writeBatch(db);
  let classesUpdated = 0;
  let workSessionsUpdated = 0;

  // Update classes where this staff is teacher
  const classesAsTeacher = query(
    collection(db, 'classes'),
    where('teacherId', '==', staffId)
  );
  const classesTeacherSnap = await getDocs(classesAsTeacher);
  classesTeacherSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      teacherId: null,
      teacher: '[Giáo viên đã xóa]',
    });
    classesUpdated++;
  });

  // Update work sessions
  const workSessionsQuery = query(
    collection(db, 'workSessions'),
    where('staffId', '==', staffId)
  );
  const workSessionsSnap = await getDocs(workSessionsQuery);
  workSessionsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      staffId: null,
      staffName: '[Nhân viên đã xóa]',
    });
    workSessionsUpdated++;
  });

  await batch.commit();

  return { classesUpdated, workSessionsUpdated };
};

/**
 * Cascade update when class name changes
 * - Updates className in all students
 */
export const cascadeUpdateClassName = async (
  classId: string,
  newClassName: string
): Promise<number> => {
  const batch = writeBatch(db);
  let studentsUpdated = 0;

  const studentsQuery = query(
    collection(db, 'students'),
    where('classId', '==', classId)
  );
  const studentsSnap = await getDocs(studentsQuery);

  studentsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      className: newClassName,
      class: newClassName,
    });
    studentsUpdated++;
  });

  if (studentsUpdated > 0) {
    await batch.commit();
  }

  return studentsUpdated;
};

// ============================================
// 2. VALIDATION BEFORE DELETE
// ============================================

export interface ValidationResult {
  canDelete: boolean;
  reason?: string;
  relatedCount?: number;
  relatedItems?: string[];
}

/**
 * Validate before deleting a class
 */
export const validateDeleteClass = async (classId: string): Promise<ValidationResult> => {
  // Check for students in this class
  const studentsQuery = query(
    collection(db, 'students'),
    where('classId', '==', classId)
  );
  const studentsSnap = await getDocs(studentsQuery);

  if (studentsSnap.size > 0) {
    const studentNames = studentsSnap.docs
      .slice(0, 5)
      .map(d => d.data().fullName || d.data().name);
    
    return {
      canDelete: false,
      reason: `Lớp học đang có ${studentsSnap.size} học viên. Vui lòng chuyển học viên sang lớp khác trước khi xóa.`,
      relatedCount: studentsSnap.size,
      relatedItems: studentNames,
    };
  }

  // Check for upcoming work sessions
  const today = new Date().toISOString().split('T')[0];
  const workSessionsQuery = query(
    collection(db, 'workSessions'),
    where('classId', '==', classId),
    where('date', '>=', today)
  );
  const workSessionsSnap = await getDocs(workSessionsQuery);

  if (workSessionsSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Lớp học còn ${workSessionsSnap.size} buổi dạy chưa hoàn thành.`,
      relatedCount: workSessionsSnap.size,
    };
  }

  return { canDelete: true };
};

/**
 * Validate before deleting a parent
 */
export const validateDeleteParent = async (parentId: string): Promise<ValidationResult> => {
  const studentsQuery = query(
    collection(db, 'students'),
    where('parentId', '==', parentId)
  );
  const studentsSnap = await getDocs(studentsQuery);

  if (studentsSnap.size > 0) {
    const studentNames = studentsSnap.docs
      .slice(0, 5)
      .map(d => d.data().fullName || d.data().name);

    return {
      canDelete: false,
      reason: `Phụ huynh có ${studentsSnap.size} học viên liên kết. Vui lòng cập nhật thông tin học viên trước.`,
      relatedCount: studentsSnap.size,
      relatedItems: studentNames,
    };
  }

  return { canDelete: true };
};

/**
 * Validate before deleting a staff member
 */
export const validateDeleteStaff = async (staffId: string): Promise<ValidationResult> => {
  // Check if teaching any classes
  const classesQuery = query(
    collection(db, 'classes'),
    where('teacherId', '==', staffId)
  );
  const classesSnap = await getDocs(classesQuery);

  if (classesSnap.size > 0) {
    const classNames = classesSnap.docs
      .slice(0, 5)
      .map(d => d.data().name);

    return {
      canDelete: false,
      reason: `Nhân viên đang phụ trách ${classesSnap.size} lớp học. Vui lòng chuyển lớp cho giáo viên khác trước.`,
      relatedCount: classesSnap.size,
      relatedItems: classNames,
    };
  }

  // Check for pending work sessions
  const workSessionsQuery = query(
    collection(db, 'workSessions'),
    where('staffId', '==', staffId),
    where('status', '==', 'Chờ xác nhận')
  );
  const workSessionsSnap = await getDocs(workSessionsQuery);

  if (workSessionsSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Nhân viên còn ${workSessionsSnap.size} buổi dạy chờ xác nhận.`,
      relatedCount: workSessionsSnap.size,
    };
  }

  return { canDelete: true };
};

/**
 * Validate before deleting a student
 */
export const validateDeleteStudent = async (studentId: string): Promise<ValidationResult> => {
  // Check for unpaid contracts
  const contractsQuery = query(
    collection(db, 'contracts'),
    where('studentId', '==', studentId),
    where('status', 'in', ['Nợ phí', 'Nháp'])
  );
  const contractsSnap = await getDocs(contractsQuery);

  if (contractsSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Học viên còn ${contractsSnap.size} hợp đồng chưa thanh toán.`,
      relatedCount: contractsSnap.size,
    };
  }

  return { canDelete: true };
};

// ============================================
// 3. DATA CONSISTENCY CHECK
// ============================================

export interface ConsistencyIssue {
  type: 'orphaned_reference' | 'data_mismatch' | 'missing_field';
  collection: string;
  documentId: string;
  field: string;
  currentValue: any;
  expectedValue?: any;
  description: string;
}

export interface ConsistencyReport {
  checkedAt: string;
  totalIssues: number;
  issues: ConsistencyIssue[];
  summary: {
    orphanedReferences: number;
    dataMismatches: number;
    missingFields: number;
  };
}

/**
 * Check data consistency across all collections
 */
export const checkDataConsistency = async (): Promise<ConsistencyReport> => {
  const issues: ConsistencyIssue[] = [];

  // Fetch all data
  const [studentsSnap, classesSnap, parentsSnap, staffSnap] = await Promise.all([
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'classes')),
    getDocs(collection(db, 'parents')),
    getDocs(collection(db, 'staff')),
  ]);

  const classesMap = new Map(classesSnap.docs.map(d => [d.id, d.data()]));
  const parentsMap = new Map(parentsSnap.docs.map(d => [d.id, d.data()]));
  const staffMap = new Map(staffSnap.docs.map(d => [d.id, d.data()]));

  // Check students
  for (const docSnap of studentsSnap.docs) {
    const student = docSnap.data();
    const studentId = docSnap.id;

    // Check orphaned classId
    if (student.classId && !classesMap.has(student.classId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'students',
        documentId: studentId,
        field: 'classId',
        currentValue: student.classId,
        description: `Student "${student.fullName || student.name}" references non-existent class`,
      });
    }

    // Check orphaned parentId
    if (student.parentId && !parentsMap.has(student.parentId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'students',
        documentId: studentId,
        field: 'parentId',
        currentValue: student.parentId,
        description: `Student "${student.fullName || student.name}" references non-existent parent`,
      });
    }

    // Check parentName mismatch
    if (student.parentId && parentsMap.has(student.parentId)) {
      const parent = parentsMap.get(student.parentId);
      if (parent?.name && student.parentName && parent.name !== student.parentName) {
        issues.push({
          type: 'data_mismatch',
          collection: 'students',
          documentId: studentId,
          field: 'parentName',
          currentValue: student.parentName,
          expectedValue: parent.name,
          description: `Student "${student.fullName}" has mismatched parentName`,
        });
      }
    }

    // Check className mismatch
    if (student.classId && classesMap.has(student.classId)) {
      const cls = classesMap.get(student.classId);
      if (cls?.name && student.className && cls.name !== student.className) {
        issues.push({
          type: 'data_mismatch',
          collection: 'students',
          documentId: studentId,
          field: 'className',
          currentValue: student.className,
          expectedValue: cls.name,
          description: `Student "${student.fullName}" has mismatched className`,
        });
      }
    }

    // Check missing required fields
    if (!student.fullName && !student.name) {
      issues.push({
        type: 'missing_field',
        collection: 'students',
        documentId: studentId,
        field: 'fullName',
        currentValue: null,
        description: `Student ${studentId} is missing name`,
      });
    }
  }

  // Check classes
  for (const docSnap of classesSnap.docs) {
    const cls = docSnap.data();
    const classId = docSnap.id;

    // Check orphaned teacherId
    if (cls.teacherId && !staffMap.has(cls.teacherId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'classes',
        documentId: classId,
        field: 'teacherId',
        currentValue: cls.teacherId,
        description: `Class "${cls.name}" references non-existent teacher`,
      });
    }
  }

  // Generate summary
  const summary = {
    orphanedReferences: issues.filter(i => i.type === 'orphaned_reference').length,
    dataMismatches: issues.filter(i => i.type === 'data_mismatch').length,
    missingFields: issues.filter(i => i.type === 'missing_field').length,
  };

  return {
    checkedAt: new Date().toISOString(),
    totalIssues: issues.length,
    issues,
    summary,
  };
};

/**
 * Auto-fix consistency issues
 */
export const fixConsistencyIssues = async (issues: ConsistencyIssue[]): Promise<{
  fixed: number;
  failed: number;
  errors: string[];
}> => {
  let fixed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const issue of issues) {
    try {
      const docRef = doc(db, issue.collection, issue.documentId);

      if (issue.type === 'orphaned_reference') {
        // Clear orphaned references
        await updateDoc(docRef, {
          [issue.field]: null,
        });
        fixed++;
      } else if (issue.type === 'data_mismatch' && issue.expectedValue !== undefined) {
        // Fix data mismatch
        await updateDoc(docRef, {
          [issue.field]: issue.expectedValue,
        });
        fixed++;
      }
      // Skip missing_field - needs manual intervention
    } catch (err: any) {
      failed++;
      errors.push(`Failed to fix ${issue.collection}/${issue.documentId}: ${err.message}`);
    }
  }

  return { fixed, failed, errors };
};

// ============================================
// HR MODULE - STAFF INTEGRITY
// ============================================

/**
 * Cascade update when staff name changes
 * - Syncs teacher name to all classes
 * - Syncs staffName to all work sessions
 */
export const cascadeUpdateStaffName = async (
  staffId: string,
  newName: string
): Promise<{ classesUpdated: number; workSessionsUpdated: number }> => {
  const batch = writeBatch(db);
  let classesUpdated = 0;
  let workSessionsUpdated = 0;

  // Update classes where this staff is teacher
  const classesQuery = query(
    collection(db, 'classes'),
    where('teacherId', '==', staffId)
  );
  const classesSnap = await getDocs(classesQuery);
  classesSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, { teacher: newName });
    classesUpdated++;
  });

  // Update classes where this staff is assistant
  const assistantQuery = query(
    collection(db, 'classes'),
    where('assistantId', '==', staffId)
  );
  const assistantSnap = await getDocs(assistantQuery);
  assistantSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, { assistant: newName });
    classesUpdated++;
  });

  // Update work sessions
  const workSessionsQuery = query(
    collection(db, 'workSessions'),
    where('staffId', '==', staffId)
  );
  const workSessionsSnap = await getDocs(workSessionsQuery);
  workSessionsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, { staffName: newName });
    workSessionsUpdated++;
  });

  if (classesUpdated > 0 || workSessionsUpdated > 0) {
    await batch.commit();
  }

  return { classesUpdated, workSessionsUpdated };
};

// ============================================
// FINANCE MODULE - CONTRACT/INVOICE INTEGRITY
// ============================================

/**
 * Validate before deleting a student (Finance check)
 */
export const validateDeleteStudentFinance = async (studentId: string): Promise<ValidationResult> => {
  // Check for unpaid contracts
  const contractsQuery = query(
    collection(db, 'contracts'),
    where('studentId', '==', studentId)
  );
  const contractsSnap = await getDocs(contractsQuery);
  
  const unpaidContracts = contractsSnap.docs.filter(d => {
    const data = d.data();
    return data.status === 'Nợ phí' || data.status === 'Nháp' || data.remainingAmount > 0;
  });

  if (unpaidContracts.length > 0) {
    return {
      canDelete: false,
      reason: `Học viên còn ${unpaidContracts.length} hợp đồng chưa thanh toán đầy đủ.`,
      relatedCount: unpaidContracts.length,
    };
  }

  // Check for invoices
  const invoicesQuery = query(
    collection(db, 'invoices'),
    where('studentId', '==', studentId),
    where('status', '==', 'Chờ thanh toán')
  );
  const invoicesSnap = await getDocs(invoicesQuery);

  if (invoicesSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Học viên còn ${invoicesSnap.size} hóa đơn chưa thanh toán.`,
      relatedCount: invoicesSnap.size,
    };
  }

  return { canDelete: true };
};

/**
 * Cascade when deleting a student (mark contracts/invoices)
 */
export const cascadeDeleteStudent = async (studentId: string, studentName?: string): Promise<{
  contractsUpdated: number;
  invoicesUpdated: number;
  attendanceDeleted: number;
}> => {
  const batch = writeBatch(db);
  let contractsUpdated = 0;
  let invoicesUpdated = 0;
  let attendanceDeleted = 0;

  // Update contracts
  const contractsQuery = query(
    collection(db, 'contracts'),
    where('studentId', '==', studentId)
  );
  const contractsSnap = await getDocs(contractsQuery);
  contractsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      studentId: null,
      studentName: studentName ? `[Đã xóa] ${studentName}` : '[Học viên đã xóa]',
    });
    contractsUpdated++;
  });

  // Update invoices
  const invoicesQuery = query(
    collection(db, 'invoices'),
    where('studentId', '==', studentId)
  );
  const invoicesSnap = await getDocs(invoicesQuery);
  invoicesSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      studentId: null,
      studentName: studentName ? `[Đã xóa] ${studentName}` : '[Học viên đã xóa]',
    });
    invoicesUpdated++;
  });

  // Delete attendance records
  const attendanceQuery = query(
    collection(db, 'studentAttendance'),
    where('studentId', '==', studentId)
  );
  const attendanceSnap = await getDocs(attendanceQuery);
  attendanceSnap.forEach((docSnap) => {
    batch.delete(docSnap.ref);
    attendanceDeleted++;
  });

  if (contractsUpdated > 0 || invoicesUpdated > 0 || attendanceDeleted > 0) {
    await batch.commit();
  }

  return { contractsUpdated, invoicesUpdated, attendanceDeleted };
};

/**
 * Validate before deleting a contract
 */
export const validateDeleteContract = async (contractId: string): Promise<ValidationResult> => {
  const contractDoc = await getDoc(doc(db, 'contracts', contractId));
  if (!contractDoc.exists()) {
    return { canDelete: true };
  }

  const contract = contractDoc.data();
  
  // Check if contract has payments
  if (contract.paidAmount > 0) {
    return {
      canDelete: false,
      reason: `Hợp đồng đã có thanh toán ${contract.paidAmount?.toLocaleString()}đ. Không thể xóa.`,
      relatedCount: 1,
    };
  }

  return { canDelete: true };
};

// ============================================
// SETTINGS MODULE - ROOM/CONFIG INTEGRITY
// ============================================

/**
 * Validate before deleting a room
 */
export const validateDeleteRoom = async (roomId: string, roomName?: string): Promise<ValidationResult> => {
  // Check if any class uses this room
  const classesQuery = query(
    collection(db, 'classes'),
    where('room', '==', roomName || roomId)
  );
  const classesSnap = await getDocs(classesQuery);

  if (classesSnap.size > 0) {
    const classNames = classesSnap.docs.slice(0, 5).map(d => d.data().name);
    return {
      canDelete: false,
      reason: `Phòng học đang được sử dụng bởi ${classesSnap.size} lớp học.`,
      relatedCount: classesSnap.size,
      relatedItems: classNames,
    };
  }

  return { canDelete: true };
};

/**
 * Cascade when deleting a room
 */
export const cascadeDeleteRoom = async (roomName: string): Promise<number> => {
  const batch = writeBatch(db);
  let classesUpdated = 0;

  const classesQuery = query(
    collection(db, 'classes'),
    where('room', '==', roomName)
  );
  const classesSnap = await getDocs(classesQuery);
  
  classesSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, { room: null });
    classesUpdated++;
  });

  if (classesUpdated > 0) {
    await batch.commit();
  }

  return classesUpdated;
};

/**
 * Validate before deleting salary config
 */
export const validateDeleteSalaryConfig = async (configId: string): Promise<ValidationResult> => {
  const configDoc = await getDoc(doc(db, 'salaryConfigs', configId));
  if (!configDoc.exists()) {
    return { canDelete: true };
  }

  const config = configDoc.data();
  
  // Check if any staff uses this config
  const staffQuery = query(
    collection(db, 'staff'),
    where('position', '==', config.position)
  );
  const staffSnap = await getDocs(staffQuery);

  if (staffSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Cấu hình lương đang được áp dụng cho ${staffSnap.size} nhân viên với vị trí "${config.position}".`,
      relatedCount: staffSnap.size,
    };
  }

  return { canDelete: true };
};

// ============================================
// SALES MODULE - LEAD/CAMPAIGN INTEGRITY
// ============================================

/**
 * Validate before deleting a campaign
 */
export const validateDeleteCampaign = async (campaignId: string): Promise<ValidationResult> => {
  const leadsQuery = query(
    collection(db, 'leads'),
    where('campaignId', '==', campaignId)
  );
  const leadsSnap = await getDocs(leadsQuery);

  if (leadsSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Chiến dịch có ${leadsSnap.size} leads liên kết. Vui lòng xóa hoặc chuyển leads trước.`,
      relatedCount: leadsSnap.size,
    };
  }

  return { canDelete: true };
};

/**
 * Cascade when deleting a campaign
 */
export const cascadeDeleteCampaign = async (campaignId: string): Promise<number> => {
  const batch = writeBatch(db);
  let leadsUpdated = 0;

  const leadsQuery = query(
    collection(db, 'leads'),
    where('campaignId', '==', campaignId)
  );
  const leadsSnap = await getDocs(leadsQuery);

  leadsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, { 
      campaignId: null,
      campaignName: '[Chiến dịch đã xóa]'
    });
    leadsUpdated++;
  });

  if (leadsUpdated > 0) {
    await batch.commit();
  }

  return leadsUpdated;
};

/**
 * Validate before deleting a lead
 */
export const validateDeleteLead = async (leadId: string): Promise<ValidationResult> => {
  const leadDoc = await getDoc(doc(db, 'leads', leadId));
  if (!leadDoc.exists()) {
    return { canDelete: true };
  }

  const lead = leadDoc.data();

  // Check if lead was converted to student
  if (lead.convertedToStudentId || lead.studentId) {
    return {
      canDelete: false,
      reason: `Lead đã được chuyển đổi thành học viên. Không thể xóa.`,
      relatedCount: 1,
    };
  }

  return { canDelete: true };
};

// ============================================
// ENHANCED CONSISTENCY CHECK
// ============================================

/**
 * Enhanced data consistency check for all modules
 */
export const checkFullDataConsistency = async (): Promise<ConsistencyReport> => {
  const issues: ConsistencyIssue[] = [];

  // Fetch all data
  const [
    studentsSnap, 
    classesSnap, 
    parentsSnap, 
    staffSnap,
    contractsSnap,
    invoicesSnap,
    workSessionsSnap,
    leadsSnap,
    campaignsSnap,
    roomsSnap
  ] = await Promise.all([
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'classes')),
    getDocs(collection(db, 'parents')),
    getDocs(collection(db, 'staff')),
    getDocs(collection(db, 'contracts')),
    getDocs(collection(db, 'invoices')),
    getDocs(collection(db, 'workSessions')),
    getDocs(collection(db, 'leads')),
    getDocs(collection(db, 'campaigns')),
    getDocs(collection(db, 'rooms')),
  ]);

  // Create lookup maps
  const classesMap = new Map(classesSnap.docs.map(d => [d.id, d.data()]));
  const parentsMap = new Map(parentsSnap.docs.map(d => [d.id, d.data()]));
  const staffMap = new Map(staffSnap.docs.map(d => [d.id, d.data()]));
  const studentsMap = new Map(studentsSnap.docs.map(d => [d.id, d.data()]));
  const campaignsMap = new Map(campaignsSnap.docs.map(d => [d.id, d.data()]));
  const roomNames = new Set(roomsSnap.docs.map(d => d.data().name || d.data().roomName));

  // Check students (existing logic)
  for (const docSnap of studentsSnap.docs) {
    const student = docSnap.data();
    const studentId = docSnap.id;

    if (student.classId && !classesMap.has(student.classId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'students',
        documentId: studentId,
        field: 'classId',
        currentValue: student.classId,
        description: `Student "${student.fullName || student.name}" references non-existent class`,
      });
    }

    if (student.parentId && !parentsMap.has(student.parentId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'students',
        documentId: studentId,
        field: 'parentId',
        currentValue: student.parentId,
        description: `Student "${student.fullName || student.name}" references non-existent parent`,
      });
    }
  }

  // Check classes
  for (const docSnap of classesSnap.docs) {
    const cls = docSnap.data();
    const classId = docSnap.id;

    if (cls.teacherId && !staffMap.has(cls.teacherId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'classes',
        documentId: classId,
        field: 'teacherId',
        currentValue: cls.teacherId,
        description: `Class "${cls.name}" references non-existent teacher`,
      });
    }

    if (cls.assistantId && !staffMap.has(cls.assistantId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'classes',
        documentId: classId,
        field: 'assistantId',
        currentValue: cls.assistantId,
        description: `Class "${cls.name}" references non-existent assistant`,
      });
    }

    // Check room exists
    if (cls.room && !roomNames.has(cls.room)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'classes',
        documentId: classId,
        field: 'room',
        currentValue: cls.room,
        description: `Class "${cls.name}" uses non-existent room "${cls.room}"`,
      });
    }
  }

  // Check contracts
  for (const docSnap of contractsSnap.docs) {
    const contract = docSnap.data();
    const contractId = docSnap.id;

    if (contract.studentId && !studentsMap.has(contract.studentId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'contracts',
        documentId: contractId,
        field: 'studentId',
        currentValue: contract.studentId,
        description: `Contract "${contract.code}" references non-existent student`,
      });
    }
  }

  // Check invoices
  for (const docSnap of invoicesSnap.docs) {
    const invoice = docSnap.data();
    const invoiceId = docSnap.id;

    if (invoice.studentId && !studentsMap.has(invoice.studentId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'invoices',
        documentId: invoiceId,
        field: 'studentId',
        currentValue: invoice.studentId,
        description: `Invoice "${invoice.code}" references non-existent student`,
      });
    }
  }

  // Check work sessions
  for (const docSnap of workSessionsSnap.docs) {
    const session = docSnap.data();
    const sessionId = docSnap.id;

    if (session.staffId && !staffMap.has(session.staffId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'workSessions',
        documentId: sessionId,
        field: 'staffId',
        currentValue: session.staffId,
        description: `Work session references non-existent staff`,
      });
    }

    if (session.classId && !classesMap.has(session.classId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'workSessions',
        documentId: sessionId,
        field: 'classId',
        currentValue: session.classId,
        description: `Work session references non-existent class`,
      });
    }
  }

  // Check leads
  for (const docSnap of leadsSnap.docs) {
    const lead = docSnap.data();
    const leadId = docSnap.id;

    if (lead.campaignId && !campaignsMap.has(lead.campaignId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'leads',
        documentId: leadId,
        field: 'campaignId',
        currentValue: lead.campaignId,
        description: `Lead "${lead.name}" references non-existent campaign`,
      });
    }

    if (lead.convertedToStudentId && !studentsMap.has(lead.convertedToStudentId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'leads',
        documentId: leadId,
        field: 'convertedToStudentId',
        currentValue: lead.convertedToStudentId,
        description: `Lead "${lead.name}" references non-existent converted student`,
      });
    }

    if (lead.assignedTo && !staffMap.has(lead.assignedTo)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'leads',
        documentId: leadId,
        field: 'assignedTo',
        currentValue: lead.assignedTo,
        description: `Lead "${lead.name}" assigned to non-existent staff`,
      });
    }
  }

  // Generate summary
  const summary = {
    orphanedReferences: issues.filter(i => i.type === 'orphaned_reference').length,
    dataMismatches: issues.filter(i => i.type === 'data_mismatch').length,
    missingFields: issues.filter(i => i.type === 'missing_field').length,
  };

  return {
    checkedAt: new Date().toISOString(),
    totalIssues: issues.length,
    issues,
    summary,
  };
};
