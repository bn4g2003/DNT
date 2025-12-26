"use strict";
/**
 * Batch operation utilities
 * Firestore has a limit of 500 operations per batch
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
exports.executeBatch = executeBatch;
exports.cascadeUpdate = cascadeUpdate;
exports.cascadeDelete = cascadeDelete;
const admin = __importStar(require("firebase-admin"));
const BATCH_SIZE = 500;
/**
 * Execute batch operations, automatically splitting if > 500
 */
async function executeBatch(operations) {
    if (operations.length === 0)
        return 0;
    const db = admin.firestore();
    let totalProcessed = 0;
    // Split into chunks of BATCH_SIZE
    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
        const chunk = operations.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        for (const op of chunk) {
            switch (op.type) {
                case 'set':
                    batch.set(op.ref, op.data);
                    break;
                case 'update':
                    batch.update(op.ref, op.data);
                    break;
                case 'delete':
                    batch.delete(op.ref);
                    break;
            }
        }
        await batch.commit();
        totalProcessed += chunk.length;
    }
    return totalProcessed;
}
/**
 * Cascade update a field across multiple documents
 */
async function cascadeUpdate(collection, queryField, queryValue, updateFields) {
    const db = admin.firestore();
    const snapshot = await db
        .collection(collection)
        .where(queryField, '==', queryValue)
        .get();
    if (snapshot.empty)
        return 0;
    const operations = snapshot.docs.map(doc => ({
        type: 'update',
        ref: doc.ref,
        data: updateFields
    }));
    return executeBatch(operations);
}
/**
 * Delete all documents matching a query
 */
async function cascadeDelete(collection, queryField, queryValue) {
    const db = admin.firestore();
    const snapshot = await db
        .collection(collection)
        .where(queryField, '==', queryValue)
        .get();
    if (snapshot.empty)
        return 0;
    const operations = snapshot.docs.map(doc => ({
        type: 'delete',
        ref: doc.ref
    }));
    return executeBatch(operations);
}
//# sourceMappingURL=batchUtils.js.map