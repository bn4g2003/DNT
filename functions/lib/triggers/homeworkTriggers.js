"use strict";
/**
 * Homework Triggers
 *
 * Handles:
 * - Auto-update student homework stats
 * - Cascade delete when class/session deleted
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
exports.onClassDeleteHomework = exports.onSessionDeleteHomework = exports.onHomeworkRecordWrite = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const REGION = 'asia-southeast1';
/**
 * Trigger: When homework record is created/updated
 * Actions:
 * - Update student's homework completion stats
 */
exports.onHomeworkRecordWrite = functions
    .region(REGION)
    .firestore
    .document('homeworkRecords/{recordId}')
    .onWrite(async (change, context) => {
    var _a;
    const recordId = context.params.recordId;
    // Handle delete
    if (!change.after.exists) {
        console.log(`[onHomeworkRecordWrite] Homework record deleted: ${recordId}`);
        return null;
    }
    const data = change.after.data();
    console.log(`[onHomeworkRecordWrite] Homework record updated: ${recordId}, class: ${data.className}, session: ${data.sessionNumber}`);
    // Calculate stats for each student
    const batch = db.batch();
    let updateCount = 0;
    for (const studentRecord of data.studentRecords) {
        const { studentId, homeworks } = studentRecord;
        // Calculate completion rate and average score
        const homeworkIds = Object.keys(homeworks);
        const completedCount = homeworkIds.filter(id => { var _a; return (_a = homeworks[id]) === null || _a === void 0 ? void 0 : _a.completed; }).length;
        const scores = homeworkIds
            .map(id => { var _a; return (_a = homeworks[id]) === null || _a === void 0 ? void 0 : _a.score; })
            .filter((score) => score !== null && score !== undefined);
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
                const existingStats = ((_a = studentDoc.data()) === null || _a === void 0 ? void 0 : _a.homeworkStats) || {};
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
exports.onSessionDeleteHomework = functions
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
exports.onClassDeleteHomework = functions
    .region(REGION)
    .firestore
    .document('classes/{classId}')
    .onDelete(async (snap, context) => {
    const classId = context.params.classId;
    const classData = snap.data();
    console.log(`[onClassDeleteHomework] Class deleted: ${classData === null || classData === void 0 ? void 0 : classData.name} (${classId})`);
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
//# sourceMappingURL=homeworkTriggers.js.map