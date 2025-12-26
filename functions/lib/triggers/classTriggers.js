"use strict";
/**
 * Class Collection Triggers
 *
 * Handles:
 * - Auto-generate sessions on create
 * - Cascade updates when class data changes
 * - Cleanup on delete
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
exports.onClassDelete = exports.onClassUpdate = exports.onClassCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const scheduleParser_1 = require("../utils/scheduleParser");
const batchUtils_1 = require("../utils/batchUtils");
const db = admin.firestore();
const REGION = 'asia-southeast1';
/**
 * Trigger: When a new class is created
 * Actions:
 * - Auto-generate sessions if schedule and totalSessions exist
 */
exports.onClassCreate = functions
    .region(REGION)
    .firestore
    .document('classes/{classId}')
    .onCreate(async (snap, context) => {
    const classId = context.params.classId;
    const classData = snap.data();
    console.log(`[onClassCreate] Class created: ${classData.name} (${classId})`);
    console.log(`[onClassCreate] Schedule: "${classData.schedule}", TotalSessions: ${classData.totalSessions}`);
    console.log(`[onClassCreate] StartDate type: ${typeof classData.startDate}, value: ${JSON.stringify(classData.startDate)}`);
    // Auto-generate sessions
    if (classData.schedule && classData.totalSessions && classData.totalSessions > 0) {
        try {
            const count = await generateClassSessions(classId, classData);
            console.log(`[onClassCreate] Generated ${count} sessions for class ${classData.name}`);
        }
        catch (error) {
            console.error(`[onClassCreate] Error generating sessions:`, error);
        }
    }
    else {
        console.log(`[onClassCreate] Skipping session generation - missing schedule (${classData.schedule}) or totalSessions (${classData.totalSessions})`);
    }
    return null;
});
/**
 * Trigger: When a class is updated
 * Actions:
 * - Cascade className to students, sessions, attendance
 * - Cascade teacher/room to sessions
 * - Regenerate sessions if schedule changed
 */
exports.onClassUpdate = functions
    .region(REGION)
    .firestore
    .document('classes/{classId}')
    .onUpdate(async (change, context) => {
    const classId = context.params.classId;
    const before = change.before.data();
    const after = change.after.data();
    console.log(`[onClassUpdate] Class updated: ${after.name} (${classId})`);
    const updates = [];
    // Check if training history was already updated by frontend
    // (to avoid duplicate entries)
    const beforeHistoryLength = (before.trainingHistory || []).length;
    const afterHistoryLength = (after.trainingHistory || []).length;
    const historyAlreadyUpdated = afterHistoryLength > beforeHistoryLength;
    // Track training history entries to add (only if not already added by frontend)
    const historyEntries = [];
    const now = new Date().toISOString();
    // 1. Cascade class name changes
    if (before.name !== after.name) {
        console.log(`[onClassUpdate] Name changed: "${before.name}" → "${after.name}"`);
        // Update students
        updates.push((0, batchUtils_1.cascadeUpdate)('students', 'classId', classId, {
            class: after.name,
            className: after.name
        }).then(count => {
            console.log(`[onClassUpdate] Updated ${count} students`);
            return count;
        }));
        // Update classSessions
        updates.push((0, batchUtils_1.cascadeUpdate)('classSessions', 'classId', classId, {
            className: after.name
        }).then(count => {
            console.log(`[onClassUpdate] Updated ${count} sessions`);
            return count;
        }));
        // Update attendance
        updates.push((0, batchUtils_1.cascadeUpdate)('attendance', 'classId', classId, {
            className: after.name
        }).then(count => {
            console.log(`[onClassUpdate] Updated ${count} attendance records`);
            return count;
        }));
    }
    // 2. Cascade teacher changes to sessions
    if (before.teacher !== after.teacher) {
        console.log(`[onClassUpdate] Teacher changed: "${before.teacher}" → "${after.teacher}"`);
        updates.push((0, batchUtils_1.cascadeUpdate)('classSessions', 'classId', classId, {
            teacherName: after.teacher || null
        }).then(count => {
            console.log(`[onClassUpdate] Updated teacher in ${count} sessions`);
            return count;
        }));
        // Add training history entry
        if (!historyAlreadyUpdated) {
            historyEntries.push({
                id: `TH_${Date.now()}_teacher_cf`,
                date: now,
                type: 'teacher_change',
                description: 'Thay đổi giáo viên chính',
                oldValue: before.teacher || 'Chưa có',
                newValue: after.teacher || 'Không có',
                changedBy: 'Cloud Function'
            });
        }
    }
    // Check assistant change
    if (before.assistant !== after.assistant && !historyAlreadyUpdated) {
        historyEntries.push({
            id: `TH_${Date.now()}_assistant_cf`,
            date: now,
            type: 'teacher_change',
            description: 'Thay đổi trợ giảng',
            oldValue: before.assistant || 'Chưa có',
            newValue: after.assistant || 'Không có',
            changedBy: 'Cloud Function'
        });
    }
    // Check foreign teacher change
    if (before.foreignTeacher !== after.foreignTeacher && !historyAlreadyUpdated) {
        historyEntries.push({
            id: `TH_${Date.now()}_foreign_cf`,
            date: now,
            type: 'teacher_change',
            description: 'Thay đổi giáo viên nước ngoài',
            oldValue: before.foreignTeacher || 'Chưa có',
            newValue: after.foreignTeacher || 'Không có',
            changedBy: 'Cloud Function'
        });
    }
    // 3. Cascade room changes to sessions
    if (before.room !== after.room) {
        console.log(`[onClassUpdate] Room changed: "${before.room}" → "${after.room}"`);
        updates.push((0, batchUtils_1.cascadeUpdate)('classSessions', 'classId', classId, {
            room: after.room || null
        }).then(count => {
            console.log(`[onClassUpdate] Updated room in ${count} sessions`);
            return count;
        }));
        // Add training history entry
        if (!historyAlreadyUpdated) {
            historyEntries.push({
                id: `TH_${Date.now()}_room_cf`,
                date: now,
                type: 'room_change',
                description: 'Thay đổi phòng học',
                oldValue: before.room || 'Chưa có',
                newValue: after.room || 'Không có',
                changedBy: 'Cloud Function'
            });
        }
    }
    // Check schedule change for training history
    if (before.schedule !== after.schedule && !historyAlreadyUpdated) {
        historyEntries.push({
            id: `TH_${Date.now()}_schedule_cf`,
            date: now,
            type: 'schedule_change',
            description: 'Thay đổi lịch học',
            oldValue: before.schedule || 'Chưa có',
            newValue: after.schedule || 'Không có',
            changedBy: 'Cloud Function'
        });
    }
    // Check status change for training history
    if (before.status !== after.status && !historyAlreadyUpdated) {
        historyEntries.push({
            id: `TH_${Date.now()}_status_cf`,
            date: now,
            type: 'status_change',
            description: 'Thay đổi trạng thái lớp',
            oldValue: before.status || 'Chưa có',
            newValue: after.status || 'Không có',
            changedBy: 'Cloud Function'
        });
    }
    // 4. Regenerate sessions if schedule or totalSessions changed
    const scheduleChanged = before.schedule !== after.schedule;
    const sessionsChanged = before.totalSessions !== after.totalSessions;
    console.log(`[onClassUpdate] Schedule check: before="${before.schedule}", after="${after.schedule}", changed=${scheduleChanged}`);
    console.log(`[onClassUpdate] TotalSessions check: before=${before.totalSessions}, after=${after.totalSessions}, changed=${sessionsChanged}`);
    if ((scheduleChanged || sessionsChanged) && after.schedule && after.totalSessions) {
        console.log(`[onClassUpdate] Schedule/sessions changed - regenerating sessions`);
        // Check if sessions already exist
        const existingSessions = await db
            .collection('classSessions')
            .where('classId', '==', classId)
            .limit(1)
            .get();
        if (existingSessions.empty) {
            // No existing sessions - generate new ones
            const count = await generateClassSessions(classId, after);
            console.log(`[onClassUpdate] Generated ${count} new sessions`);
        }
        else {
            console.log(`[onClassUpdate] Sessions already exist - skipping regeneration`);
            // TODO: Could add option to regenerate/update existing sessions
        }
    }
    // Wait for all cascade updates
    const results = await Promise.all(updates);
    const totalUpdated = results.reduce((sum, count) => sum + count, 0);
    console.log(`[onClassUpdate] Total documents updated: ${totalUpdated}`);
    // 5. Save training history entries (if any and not already added by frontend)
    if (historyEntries.length > 0) {
        console.log(`[onClassUpdate] Adding ${historyEntries.length} training history entries`);
        try {
            const existingHistory = after.trainingHistory || [];
            await db.collection('classes').doc(classId).update({
                trainingHistory: [...existingHistory, ...historyEntries]
            });
            console.log(`[onClassUpdate] Training history updated successfully`);
        }
        catch (err) {
            console.error(`[onClassUpdate] Error updating training history:`, err);
        }
    }
    return null;
});
/**
 * Trigger: When a class is deleted
 * Actions:
 * - Delete all related sessions
 * - Update students (clear classId)
 * - Archive/delete attendance records
 */
exports.onClassDelete = functions
    .region(REGION)
    .firestore
    .document('classes/{classId}')
    .onDelete(async (snap, context) => {
    const classId = context.params.classId;
    const classData = snap.data();
    console.log(`[onClassDelete] Class deleted: ${classData.name} (${classId})`);
    // 1. Delete all sessions for this class
    const sessionsDeleted = await (0, batchUtils_1.cascadeDelete)('classSessions', 'classId', classId);
    console.log(`[onClassDelete] Deleted ${sessionsDeleted} sessions`);
    // 2. Update students - clear class reference
    const studentsUpdated = await (0, batchUtils_1.cascadeUpdate)('students', 'classId', classId, {
        classId: null,
        class: null,
        className: null
    });
    console.log(`[onClassDelete] Cleared class from ${studentsUpdated} students`);
    // 3. Keep attendance records but mark class as deleted
    const attendanceUpdated = await (0, batchUtils_1.cascadeUpdate)('attendance', 'classId', classId, {
        classDeleted: true,
        classDeletedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`[onClassDelete] Marked ${attendanceUpdated} attendance records`);
    return null;
});
/**
 * Helper: Generate sessions for a class
 */
async function generateClassSessions(classId, classData) {
    if (!classData.schedule || !classData.totalSessions) {
        console.log(`[generateClassSessions] Missing schedule or totalSessions`);
        return 0;
    }
    console.log(`[generateClassSessions] Parsing schedule: "${classData.schedule}"`);
    const { time, days } = (0, scheduleParser_1.parseSchedule)(classData.schedule);
    console.log(`[generateClassSessions] Parsed: time=${time}, days=[${days.join(',')}]`);
    if (days.length === 0) {
        console.log(`[generateClassSessions] Could not parse schedule: ${classData.schedule}`);
        return 0;
    }
    // Handle startDate which can be string or Firestore Timestamp
    let startDate;
    if (classData.startDate) {
        if (typeof classData.startDate === 'string') {
            startDate = classData.startDate;
        }
        else if (classData.startDate.toDate) {
            // Firestore Timestamp
            startDate = classData.startDate.toDate().toISOString().split('T')[0];
        }
        else {
            startDate = new Date().toISOString().split('T')[0];
        }
    }
    else {
        startDate = new Date().toISOString().split('T')[0];
    }
    console.log(`[generateClassSessions] Start date: ${startDate}`);
    const sessionDates = (0, scheduleParser_1.generateSessionDates)(startDate, classData.totalSessions, days);
    if (sessionDates.length === 0) {
        return 0;
    }
    const operations = sessionDates.map((session, index) => ({
        type: 'set',
        ref: db.collection('classSessions').doc(),
        data: {
            classId,
            className: classData.name,
            sessionNumber: index + 1,
            date: session.date,
            dayOfWeek: session.dayOfWeek,
            time: time,
            room: classData.room || null,
            teacherId: classData.teacherId || null,
            teacherName: classData.teacher || null,
            status: 'Chưa học',
            createdAt: new Date().toISOString()
        }
    }));
    return (0, batchUtils_1.executeBatch)(operations);
}
//# sourceMappingURL=classTriggers.js.map