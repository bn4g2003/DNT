"use strict";
/**
 * Script to sync totalSessions from classSessions collection to classes collection
 * Run from functions folder: npx ts-node src/scripts/syncTotalSessions.ts
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
const admin = __importStar(require("firebase-admin"));
const path = __importStar(require("path"));
// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../../service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
});
const db = admin.firestore();
async function syncTotalSessions() {
    console.log('🔄 Starting totalSessions sync...\n');
    // Get all classes
    const classesSnap = await db.collection('classes').get();
    console.log(`📚 Found ${classesSnap.size} classes\n`);
    let updated = 0;
    let skipped = 0;
    let noSessions = 0;
    for (const classDoc of classesSnap.docs) {
        const classData = classDoc.data();
        const classId = classDoc.id;
        const className = classData.name;
        // Count actual sessions in classSessions collection
        const sessionsSnap = await db.collection('classSessions')
            .where('classId', '==', classId)
            .get();
        const actualSessionCount = sessionsSnap.size;
        const currentTotalSessions = classData.totalSessions;
        console.log(`📖 ${className}:`);
        console.log(`   - Current totalSessions: ${currentTotalSessions || 'NOT SET'}`);
        console.log(`   - Actual sessions in DB: ${actualSessionCount}`);
        if (actualSessionCount === 0) {
            console.log(`   ⚠️  No sessions found - skipping\n`);
            noSessions++;
            continue;
        }
        if (currentTotalSessions === actualSessionCount) {
            console.log(`   ✅ Already in sync\n`);
            skipped++;
            continue;
        }
        // Update class with actual session count
        await db.collection('classes').doc(classId).update({
            totalSessions: actualSessionCount,
            progress: `0/${actualSessionCount}`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`   ✅ Updated totalSessions: ${currentTotalSessions || 'null'} → ${actualSessionCount}\n`);
        updated++;
    }
    console.log('\n========== SYNC COMPLETE ==========');
    console.log(`✅ Updated: ${updated} classes`);
    console.log(`⏭️  Skipped (already synced): ${skipped} classes`);
    console.log(`⚠️  No sessions: ${noSessions} classes`);
    console.log('====================================\n');
    process.exit(0);
}
syncTotalSessions().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
//# sourceMappingURL=syncTotalSessions.js.map