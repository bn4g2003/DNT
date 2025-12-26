"use strict";
/**
 * Holiday Triggers
 *
 * Handles:
 * - Auto-apply holiday to sessions when status changes
 * - Revert sessions when holiday is unapplied
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onHolidayDelete = exports.onHolidayUpdate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const REGION = 'asia-southeast1';
/**
 * Get all dates between start and end (inclusive)
 */
function getDateRange(startDate, endDate) {
    const dates = [];
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
exports.onHolidayUpdate = functions
    .region(REGION)
    .firestore
    .document('holidays/{holidayId}')
    .onUpdate(async (change, context) => {
    const holidayId = context.params.holidayId;
    const before = change.before.data();
    const after = change.after.data();
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
    }
    else {
        // Unapply holiday - revert sessions to "Chưa học"
        return unapplyHoliday(holidayId, after);
    }
});
/**
 * Apply holiday to sessions
 */
async function applyHoliday(holidayId, holiday, dates) {
    console.log(`[applyHoliday] Applying holiday to sessions...`);
    // Get class IDs to apply to
    let classIds = [];
    if (holiday.applyType === 'all_classes' || holiday.applyType === 'all_branches') {
        // Get all active classes
        const classesSnap = await db.collection('classes')
            .where('status', 'in', ['Đang học', 'Chờ mở'])
            .get();
        classIds = classesSnap.docs.map(doc => doc.id);
    }
    else if (holiday.applyType === 'specific_branch' && holiday.branch) {
        // Get classes in specific branch
        const classesSnap = await db.collection('classes')
            .where('branch', '==', holiday.branch)
            .where('status', 'in', ['Đang học', 'Chờ mở'])
            .get();
        classIds = classesSnap.docs.map(doc => doc.id);
    }
    else if (holiday.applyType === 'specific_classes' && holiday.classIds) {
        classIds = holiday.classIds;
    }
    console.log(`[applyHoliday] Applying to ${classIds.length} classes`);
    if (classIds.length === 0) {
        console.log('[applyHoliday] No classes to apply to');
        return null;
    }
    // Find sessions in the holiday date range for these classes
    const affectedSessionIds = [];
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
async function unapplyHoliday(holidayId, holiday) {
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
            if ((session === null || session === void 0 ? void 0 : session.status) === 'Nghỉ' && (session === null || session === void 0 ? void 0 : session.holidayId) === holidayId) {
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
exports.onHolidayDelete = functions
    .region(REGION)
    .firestore
    .document('holidays/{holidayId}')
    .onDelete(async (snap, context) => {
    const holidayId = context.params.holidayId;
    const holiday = snap.data();
    console.log(`[onHolidayDelete] Holiday deleted: ${holiday.name} (${holidayId})`);
    // If holiday was applied, revert sessions
    if (holiday.status === 'Đã áp dụng') {
        await unapplyHoliday(holidayId, holiday);
    }
    return null;
});
//# sourceMappingURL=holidayTriggers.js.map