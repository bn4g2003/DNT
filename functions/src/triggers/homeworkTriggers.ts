/**
 * Homework Triggers
 * 
 * Handles:
 * - Auto-update student homework stats
 * - Cascade delete when class/session deleted
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const REGION = 'asia-southeast1';

interface HomeworkRecord {
  classId: string;
  className: string;
  sessionId: string;
  sessionNumber: number;
  sessionDate: string;
  homeworks: { id: string; name: string }[];
  studentRecords: {
    studentId: string;
    studentName: string;
    homeworks: {
      [homeworkId: string]: {
        completed: boolean;
        score: number | null;
      };
    };
    note: string;
  }[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Trigger: When homework record is created/updated
 * Actions:
 * - Update student's homework completion stats
 */
export const onHomeworkRecordWrite = functions
  .region(REGION)
  .firestore
  .document('homeworkRecords/{recordId}')
  .onWrite(async (change, context) => {
    const recordId = context.params.recordId;
    
    // Handle delete
    if (!change.after.exists) {
      console.log(`[onHomeworkRecordWrite] Homework record deleted: ${recordId}`);
      return null;
    }
    
    const data = change.after.data() as HomeworkRecord;
    console.log(`[onHomeworkRecordWrite] Homework record updated: ${recordId}, class: ${data.className}, session: ${data.sessionNumber}`);
    
    // Calculate stats for each student
    const batch = db.batch();
    let updateCount = 0;
    
    for (const studentRecord of data.studentRecords) {
      const { studentId, homeworks } = studentRecord;
      
      // Calculate completion rate and average score
      const homeworkIds = Object.keys(homeworks);
      const completedCount = homeworkIds.filter(id => homeworks[id]?.completed).length;
      const scores = homeworkIds
        .map(id => homeworks[id]?.score)
        .filter((score): score is number => score !== null && score !== undefined);
      
      const avgScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : null;
      
      // Update student document with homework stats (optional - for reporting)
      // Only update if there are homework entries
      if (homeworkIds.length > 0) {
        const studentRef = db.collection('students').doc(studentId);
        
        // Get existing homework stats
        const studentDoc = await studentRef.get();
        if (studentDoc.exists) {
          const existingStats = studentDoc.data()?.homeworkStats || {};
          
          // Update stats for this session
          existingStats[data.sessionId] = {
            sessionNumber: data.sessionNumber,
            sessionDate: data.sessionDate,
            totalHomeworks: homeworkIds.length,
            completedHomeworks: completedCount,
            averageScore: avgScore,
            updatedAt: new Date().toISOString()
          };
          
          batch.update(studentRef, {
            homeworkStats: existingStats,
            lastHomeworkUpdate: new Date().toISOString()
          });
          updateCount++;
        }
      }
    }
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`[onHomeworkRecordWrite] Updated homework stats for ${updateCount} students`);
    }
    
    return null;
  });

/**
 * Trigger: When a class session is deleted
 * Actions:
 * - Delete associated homework records
 */
export const onSessionDeleteHomework = functions
  .region(REGION)
  .firestore
  .document('classSessions/{sessionId}')
  .onDelete(async (snap, context) => {
    const sessionId = context.params.sessionId;
    
    console.log(`[onSessionDeleteHomework] Session deleted: ${sessionId}`);
    
    // Find and delete associated homework records
    const homeworkSnap = await db.collection('homeworkRecords')
      .where('sessionId', '==', sessionId)
      .get();
    
    if (homeworkSnap.empty) {
      console.log(`[onSessionDeleteHomework] No homework records found for session ${sessionId}`);
      return null;
    }
    
    const batch = db.batch();
    homeworkSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`[onSessionDeleteHomework] Deleted ${homeworkSnap.size} homework records`);
    
    return null;
  });

/**
 * Trigger: When a class is deleted
 * Actions:
 * - Delete all associated homework records
 */
export const onClassDeleteHomework = functions
  .region(REGION)
  .firestore
  .document('classes/{classId}')
  .onDelete(async (snap, context) => {
    const classId = context.params.classId;
    const classData = snap.data();
    
    console.log(`[onClassDeleteHomework] Class deleted: ${classData?.name} (${classId})`);
    
    // Find and delete all homework records for this class
    const homeworkSnap = await db.collection('homeworkRecords')
      .where('classId', '==', classId)
      .get();
    
    if (homeworkSnap.empty) {
      console.log(`[onClassDeleteHomework] No homework records found for class ${classId}`);
      return null;
    }
    
    const batch = db.batch();
    homeworkSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`[onClassDeleteHomework] Deleted ${homeworkSnap.size} homework records`);
    
    return null;
  });
