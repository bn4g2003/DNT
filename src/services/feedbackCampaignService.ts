/**
 * Feedback Campaign Service
 * Quản lý chiến dịch khảo sát và submissions
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
    Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    FeedbackCampaign,
    FeedbackToken,
    FeedbackSubmission,
    DEFAULT_FEEDBACK_QUESTIONS
} from '../types/feedbackTypes';

const CAMPAIGNS_COLLECTION = 'feedbackCampaigns';
const TOKENS_COLLECTION = 'feedbackTokens';
const SUBMISSIONS_COLLECTION = 'feedbackSubmissions';

// Generate random token
const generateToken = (): string => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};

export class FeedbackCampaignService {
    // ========================================
    // CAMPAIGNS
    // ========================================

    static async getCampaigns(): Promise<FeedbackCampaign[]> {
        const q = query(
            collection(db, CAMPAIGNS_COLLECTION),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FeedbackCampaign[];
    }

    static async getCampaign(id: string): Promise<FeedbackCampaign | null> {
        const docRef = doc(db, CAMPAIGNS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as FeedbackCampaign;
    }

    static async createCampaign(data: Omit<FeedbackCampaign, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, CAMPAIGNS_COLLECTION), {
            ...data,
            questions: data.questions || DEFAULT_FEEDBACK_QUESTIONS,
            status: data.status || 'draft',
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    }

    static async updateCampaign(id: string, data: Partial<FeedbackCampaign>): Promise<void> {
        const docRef = doc(db, CAMPAIGNS_COLLECTION, id);
        await updateDoc(docRef, data);
    }

    static async deleteCampaign(id: string): Promise<void> {
        // Delete all tokens and submissions for this campaign
        const tokensQuery = query(
            collection(db, TOKENS_COLLECTION),
            where('campaignId', '==', id)
        );
        const tokensSnapshot = await getDocs(tokensQuery);
        for (const tokenDoc of tokensSnapshot.docs) {
            await deleteDoc(doc(db, TOKENS_COLLECTION, tokenDoc.id));
        }

        const submissionsQuery = query(
            collection(db, SUBMISSIONS_COLLECTION),
            where('campaignId', '==', id)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        for (const subDoc of submissionsSnapshot.docs) {
            await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, subDoc.id));
        }

        await deleteDoc(doc(db, CAMPAIGNS_COLLECTION, id));
    }

    static onCampaignsChange(callback: (campaigns: FeedbackCampaign[]) => void): Unsubscribe {
        const q = query(
            collection(db, CAMPAIGNS_COLLECTION),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const campaigns = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FeedbackCampaign[];
            callback(campaigns);
        });
    }

    // ========================================
    // TOKENS - Tạo link cho học viên
    // ========================================

    static async generateTokensForCampaign(
        campaignId: string,
        students: Array<{ id: string; name: string; classId?: string; className?: string }>
    ): Promise<FeedbackToken[]> {
        const tokens: FeedbackToken[] = [];

        for (const student of students) {
            // Check if token already exists
            const existingQuery = query(
                collection(db, TOKENS_COLLECTION),
                where('campaignId', '==', campaignId),
                where('studentId', '==', student.id)
            );
            const existingSnapshot = await getDocs(existingQuery);

            if (existingSnapshot.empty) {
                const token = generateToken();
                const docRef = await addDoc(collection(db, TOKENS_COLLECTION), {
                    campaignId,
                    studentId: student.id,
                    studentName: student.name,
                    classId: student.classId || null,
                    className: student.className || null,
                    token,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });
                tokens.push({
                    id: docRef.id,
                    campaignId,
                    studentId: student.id,
                    studentName: student.name,
                    classId: student.classId,
                    className: student.className,
                    token,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });
            } else {
                const existingToken = existingSnapshot.docs[0];
                tokens.push({
                    id: existingToken.id,
                    ...existingToken.data()
                } as FeedbackToken);
            }
        }

        return tokens;
    }

    static async getTokensByCampaign(campaignId: string): Promise<FeedbackToken[]> {
        const q = query(
            collection(db, TOKENS_COLLECTION),
            where('campaignId', '==', campaignId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FeedbackToken[];
    }

    static async getTokenByValue(token: string): Promise<FeedbackToken | null> {
        const q = query(
            collection(db, TOKENS_COLLECTION),
            where('token', '==', token)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as FeedbackToken;
    }

    static async markTokenAsSubmitted(tokenId: string): Promise<void> {
        const docRef = doc(db, TOKENS_COLLECTION, tokenId);
        await updateDoc(docRef, { status: 'submitted' });
    }

    // ========================================
    // SUBMISSIONS - Khi học viên/phụ huynh điền form
    // ========================================

    static async submitFeedback(data: Omit<FeedbackSubmission, 'id'>): Promise<string> {
        // Calculate average score
        const scores = [
            data.teacherScore || 0,
            data.curriculumScore || 0,
            data.careScore || 0,
            data.facilitiesScore || 0
        ].filter(s => s > 0);

        const averageScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

        const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), {
            ...data,
            averageScore,
            submittedAt: new Date().toISOString()
        });

        // Mark token as submitted
        if (data.tokenId) {
            await this.markTokenAsSubmitted(data.tokenId);
        }

        return docRef.id;
    }

    static async getSubmissions(campaignId?: string): Promise<FeedbackSubmission[]> {
        let q;
        if (campaignId) {
            q = query(
                collection(db, SUBMISSIONS_COLLECTION),
                where('campaignId', '==', campaignId),
                orderBy('submittedAt', 'desc')
            );
        } else {
            q = query(
                collection(db, SUBMISSIONS_COLLECTION),
                orderBy('submittedAt', 'desc')
            );
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FeedbackSubmission[];
    }

    static onSubmissionsChange(
        callback: (submissions: FeedbackSubmission[]) => void,
        campaignId?: string
    ): Unsubscribe {
        let q;
        if (campaignId) {
            q = query(
                collection(db, SUBMISSIONS_COLLECTION),
                where('campaignId', '==', campaignId),
                orderBy('submittedAt', 'desc')
            );
        } else {
            q = query(
                collection(db, SUBMISSIONS_COLLECTION),
                orderBy('submittedAt', 'desc')
            );
        }
        return onSnapshot(q, (snapshot) => {
            const submissions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FeedbackSubmission[];
            callback(submissions);
        });
    }

    // ========================================
    // STATISTICS
    // ========================================

    static async getCampaignStats(campaignId: string): Promise<{
        total: number;
        submitted: number;
        pending: number;
        averageScore: number;
    }> {
        const tokens = await this.getTokensByCampaign(campaignId);
        const submissions = await this.getSubmissions(campaignId);

        const avgScore = submissions.length > 0
            ? submissions.reduce((sum, s) => sum + (s.averageScore || 0), 0) / submissions.length
            : 0;

        return {
            total: tokens.length,
            submitted: tokens.filter(t => t.status === 'submitted').length,
            pending: tokens.filter(t => t.status === 'pending').length,
            averageScore: Math.round(avgScore * 10) / 10
        };
    }
}
