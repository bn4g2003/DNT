/**
 * Holiday Triggers
 * 
 * Handles:
 * - Auto-apply holiday to sessions when status changes
 * - Revert sessions when holiday is unapplied
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const REGION = 'asia-southeast1';

interface HolidayData {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Đã áp dụng' | 'Chưa áp dụng';
  applyType: 'all_classes' | 'specific_classes' | 'specific_branch' | 'all_branches';
  classIds?: string[];
  branch?: string;
  affectedSessionIds?: string[];
}

/**
 * Get all dates between start and end (inclusive)
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Trigger: When a holiday is updated
 * Actions:
 * - Apply/unapply holiday to class sessions
 */
export const onHolidayUpdate = functions
  .region(REGION)
  .firestore
  .document('holidays/{holidayId}')
  .onUpdate(async (change, context) => {
    const holidayId = context.params.holidayId;
    const before = change.before.data() as HolidayData;
    const after = change.after.data() as HolidayData;

    console.log(`[onHolidayUpdate] Holiday updated: ${after.name} (${holidayId})`);
    console.log(`[onHolidayUpdate] Status change: ${before.status} → ${after.status}`);

    // Only process if status changed
    if (before.status === after.status) {
      console.log('[onHolidayUpdate] Status unchanged, skipping');
      return null;
    }

    const holidayDates = getDateRange(after.startDate, after.endDate);
    console.log(`[onHolidayUpdate] Holiday dates: ${holidayDates.join(', ')}`);

    if (after.status === 'Đã áp dụng') {
      // Apply holiday - mark sessions as "Nghỉ"
      return applyHoliday(holidayId, after, holidayDates);
    } else {
      // Unapply holiday - revert sessions to "Chưa học"
      return unapplyHoliday(holidayId, after);
    }
  });

/**
 * Apply holiday to sessions
 */
async function applyHoliday(holidayId: string, holiday: HolidayData, dates: string[]) {
  console.log(`[applyHoliday] Applying holiday to sessions...`);
  
  // Get class IDs to apply to
  let classIds: string[] = [];
  
  if (holiday.applyType === 'all_classes' || holiday.applyType === 'all_branches') {
    // Get all active classes
    const classesSnap = await db.collection('classes')
      .where('status', 'in', ['Đang học', 'Chờ mở'])
      .get();
    classIds = classesSnap.docs.map(doc => doc.id);
  } else if (holiday.applyType === 'specific_branch' && holiday.branch) {
    // Get classes in specific branch
    const classesSnap = await db.collection('classes')
      .where('branch', '==', holiday.branch)
      .where('status', 'in', ['Đang học', 'Chờ mở'])
      .get();
    classIds = classesSnap.docs.map(doc => doc.id);
  } else if (holiday.applyType === 'specific_classes' && holiday.classIds) {
    classIds = holiday.classIds;
  }

  console.log(`[applyHoliday] Applying to ${classIds.length} classes`);

  if (classIds.length === 0) {
    console.log('[applyHoliday] No classes to apply to');
    return null;
  }

  // Find sessions in the holiday date range for these classes
  const affectedSessionIds: string[] = [];
  const batch = db.batch();
  let batchCount = 0;

  for (const classId of classIds) {
    const sessionsSnap = await db.collection('classSessions')
      .where('classId', '==', classId)
      .where('date', 'in', dates.slice(0, 10)) // Firestore 'in' limit is 10
      .get();

    for (const doc of sessionsSnap.docs) {
      const session = doc.data();
      // Only update if session is not already completed
      if (session.status === 'Chưa học') {
        batch.update(doc.ref, { 
          status: 'Nghỉ',
          holidayId: holidayId,
          holidayName: holiday.name
        });
        affectedSessionIds.push(doc.id);
        batchCount++;
      }
    }
  }

  // Handle more than 10 dates (need multiple queries)
  if (dates.length > 10) {
    for (let i = 10; i < dates.length; i += 10) {
      const dateSlice = dates.slice(i, i + 10);
      for (const classId of classIds) {
        const sessionsSnap = await db.collection('classSessions')
          .where('classId', '==', classId)
          .where('date', 'in', dateSlice)
          .get();

        for (const doc of sessionsSnap.docs) {
          const session = doc.data();
          if (session.status === 'Chưa học') {
            batch.update(doc.ref, { 
              status: 'Nghỉ',
              holidayId: holidayId,
              holidayName: holiday.name
            });
            affectedSessionIds.push(doc.id);
            batchCount++;
          }
        }
      }
    }
  }

  console.log(`[applyHoliday] Marking ${batchCount} sessions as "Nghỉ"`);

  if (batchCount > 0) {
    await batch.commit();
    
    // Save affected session IDs to holiday for later reverting
    await db.collection('holidays').doc(holidayId).update({
      affectedSessionIds: affectedSessionIds
    });
  }

  console.log(`[applyHoliday] Holiday applied successfully`);
  return null;
}

/**
 * Unapply holiday - revert sessions
 */
async function unapplyHoliday(holidayId: string, holiday: HolidayData) {
  console.log(`[unapplyHoliday] Reverting sessions...`);

  const affectedSessionIds = holiday.affectedSessionIds || [];
  
  if (affectedSessionIds.length === 0) {
    console.log('[unapplyHoliday] No sessions to revert');
    return null;
  }

  const batch = db.batch();
  let batchCount = 0;

  for (const sessionId of affectedSessionIds) {
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    
    if (sessionSnap.exists) {
      const session = sessionSnap.data();
      // Only revert if session is still marked as holiday
      if (session?.status === 'Nghỉ' && session?.holidayId === holidayId) {
        batch.update(sessionRef, { 
          status: 'Chưa học',
          holidayId: admin.firestore.FieldValue.delete(),
          holidayName: admin.firestore.FieldValue.delete()
        });
        batchCount++;
      }
    }
  }

  console.log(`[unapplyHoliday] Reverting ${batchCount} sessions to "Chưa học"`);

  if (batchCount > 0) {
    await batch.commit();
    
    // Clear affected session IDs
    await db.collection('holidays').doc(holidayId).update({
      affectedSessionIds: []
    });
  }

  console.log(`[unapplyHoliday] Holiday reverted successfully`);
  return null;
}

/**
 * Trigger: When a holiday is deleted
 * Actions:
 * - Revert any applied sessions
 */
export const onHolidayDelete = functions
  .region(REGION)
  .firestore
  .document('holidays/{holidayId}')
  .onDelete(async (snap, context) => {
    const holidayId = context.params.holidayId;
    const holiday = snap.data() as HolidayData;

    console.log(`[onHolidayDelete] Holiday deleted: ${holiday.name} (${holidayId})`);

    // If holiday was applied, revert sessions
    if (holiday.status === 'Đã áp dụng') {
      await unapplyHoliday(holidayId, holiday);
    }

    return null;
  });
